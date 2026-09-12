# frozen_string_literal: true

# 希顶聊天字母语法糖：源文件中以 %%...%% 包裹的文字，渲染为
#   <span lang="qsd">PUA 码点</span>（U+E020 区段）
#
# 用法示例：%%xdi8 aho%% → <span lang="qsd">...</span>
#
# 在 post_render 阶段处理渲染后的 HTML，故不区分源格式（md / html / 集合），
# _md 片段、excerpt、模板输出的内容此时均已并入宿主页；<pre>/<code> 内的
# %% 不转换，便于代码块展示聊天字母原文。编码算法与前端 chatToXdPUA 一致。

module Xdi8Chat
  ALPHABET = " bpmwjqxynzDsrHNldtgkh45vF7BcfuaoeEAYL62T83V1i"
  CASE_MAP = { "^" => 0, "~" => 2, "⇧" => 0, "⇩" => 2 }.freeze

  LETTER_RE = /([\^~⇧⇩]?)([a-zABDEFHLNTVY1-8])/
  DELIM_RE  = /%%(.*?)%%/m
  CODE_RE   = /(<pre\b[^>]*>.*?<\/pre>|<code\b[^>]*>.*?<\/code>)/mi

  module_function

  # 聊天字母文本 → PUA 码点文本
  def chat_to_pua(text)
    text.gsub(LETTER_RE) do
      ord = ALPHABET.index(Regexp.last_match(2))
      cas = CASE_MAP.fetch(Regexp.last_match(1), 1)
      (0xE020 + (ord & 15) + cas * 16 + (ord >> 4) * 48).chr(Encoding::UTF_8)
    end
  end

  # 替换 %%..%%，跳过 <pre>/<code> 块（split 捕获组使段落奇偶交替）
  def expand(html)
    html.split(CODE_RE).each_with_index.map do |seg, i|
      next seg if i.odd?

      seg.gsub(DELIM_RE) { %(<span lang="qsd">#{chat_to_pua($1)}</span>) }
    end.join
  end

  # 仅处理 <body> 内的内容；无 <body> 的输出（如 feed.xml）整段视为正文
  def expand_document(html)
    if (m = html.match(%r{<body\b[^>]*>}))
      head = html[0...m.end(0)]
      body = html[m.end(0)..]
      head + expand(body)
    else
      expand(html)
    end
  end
end

# 遍历全部页面与文档，覆盖纯 HTML 页面、_md 片段宿主页及博文等。
# 限定在 <body> 内替换，避免污染 jekyll-seo-tag 在 <head> 生成的
# meta description / og:* / JSON-LD。
Jekyll::Hooks.register :site, :post_render do |site, _payload|
  (site.pages + site.documents).each do |doc|
    next unless doc.output

    doc.output = Xdi8Chat.expand_document(doc.output)
  end
end

# 房产工具 / Property Listing Tools

原创、无依赖的 Chrome MV3 MVP，Node 20 内置测试。

- Rightmove 搜索页和房源页：点击「导出 CSV」，读取当前 DOM 可见房源字段（价格、地址、卧室、浴室、类型、中介、链接、新增/降价）。缺失字段留空，链接去重；CSV 含 UTF-8 BOM、标准引号转义及公式前缀保护。
- 每天本地免费导出最多 20 行，超出只导出剩余行；耗尽显示「今日免费额度已用完」。扩展选项提供可清除的本地授权 stub，无支付。按本机日期重置，删除本地数据可重置额度；这不是安全的商业授权系统。额度在发起下载时扣除，取消下载也计入。
- Zillow homedetails：读取可见「Nearby sold / Recently sold / Comparable」区域内标注 Sold 的卡片，或 DOM 中 JSON 的明确 comps / nearbySoldHomes 等集合中的已成交记录。显示数量、成交价中位数、范围及每平方英尺价格中位数；缺面积不参与后者。没有证据则显示「无法判定：页面无成交数据」。不作估价或评级。
- 可见指页面已渲染、非隐藏的元素，包括需滚动查看的内容；不会自动滚动、翻页或读取隐藏房源。不调用网站 API、无网络请求、无付费 API、无密钥、无遥测。

加载：打开 `chrome://extensions` → **开发者模式** → **加载已解压** → 选择本目录。安装后刷新目标页面，使用右下角面板或扩展弹窗；页面异步加载后可点击按钮重试。测试：`npm test`。

**尚未在真实网站上进行实时验证。** Fixtures 是合成样本；站点 DOM 变化、登录/反爬页面可能导致字段缺失或无法判定。图标是从参考项目复制的占位 PNG。

An original, offline Chrome MV3 MVP: export rendered Rightmove listings as BOM CSV (20 free rows per local day), and summarize explicitly sold Zillow comparables already present in DOM cards or embedded page JSON. Missing evidence stays unknown; no API calls, ratings, telemetry, or paid services. Local license is a demonstration stub only.

Load unpacked: `chrome://extensions` → Developer mode (开发者模式) → Load unpacked (加载已解压) → select this folder; refresh target tabs. Run `npm test` with Node 20. **NOT live-verified on real sites.** Synthetic fixtures do not guarantee compatibility with current site markup.

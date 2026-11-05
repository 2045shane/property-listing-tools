# 房产工具 / Property Listing Tools

原创、无依赖的 Chrome MV3 扩展，Node 20+ 内置测试。v1 全免费，没有付费墙。

- Rightmove 搜索页和房源页：点击「导出 CSV」，读取当前 DOM 可见房源字段（价格、地址、卧室、浴室、类型、中介、链接、新增/降价）。缺失字段留空，链接去重；CSV 含 UTF-8 BOM、标准引号转义及公式前缀保护。
- 每天本地免费导出最多 20 行，超出只导出剩余行；耗尽显示「今日免费额度已用完」。扩展选项提供可清除的本地授权 stub，无支付。按本机日期重置，删除本地数据可重置额度；这不是安全的商业授权系统。额度在发起下载时扣除，取消下载也计入。
- Zillow homedetails：读取可见「Nearby sold / Recently sold / Comparable」区域内标注 Sold 的卡片，或 DOM 中 JSON 的明确 comps / nearbySoldHomes 等集合中的已成交记录。显示数量、成交价中位数、范围及每平方英尺价格中位数；缺面积不参与后者。没有证据则显示「无法判定：页面无成交数据」。不作估价或评级。
- Zillow homedetails 另显示 HUD Fair Market Rent / Small Area FMR 面板（见下方 Feature Map）。只在 `www.zillow.com/homedetails/` 注入。Redfin、Realtor 不在本版。
- 可见指页面已渲染、非隐藏的元素，包括需滚动查看的内容；不会自动滚动、翻页或读取隐藏房源。不调用房源站 API，不调用 HUD API，无网络请求，无付费租金 API，无密钥，无遥测。

加载：打开 `chrome://extensions` → **开发者模式** → **加载已解压** → 选择本目录。安装后刷新目标页面，使用右下角面板或扩展弹窗；页面异步加载后可点击按钮重试。测试：`npm test`。

**尚未在真实网站上进行实时验证。** Fixtures 是合成样本；站点 DOM 变化、登录/反爬页面可能导致字段缺失或无法判定。图标是从参考项目复制的占位 PNG。

An original, offline Chrome MV3 extension: export rendered Rightmove listings as BOM CSV (20 free rows per local day), summarize explicitly sold Zillow comparables already present on the page, and show packed HUD FY2027 Small Area FMRs for a Zillow homedetails ZIP. Missing evidence stays unknown. No network calls, ratings, telemetry, or paid services. Local license is a demonstration stub only.

Load unpacked: `chrome://extensions` → Developer mode (开发者模式) → Load unpacked (加载已解压) → select this folder; refresh target tabs. Run `npm test` with Node 20+. **NOT live-verified on real sites.** Synthetic fixtures do not guarantee compatibility with current site markup.

## Feature Map（`SECTION8-FMR-CUT-2026-11-05-v1`）

| Feature | v1 |
| --- | --- |
| Zillow homedetails FMR/SAFMR 面板 | 有 |
| ZIP → 0–4 卧室租金 + FY + HUD USER 来源链接 | 有 |
| 页上有挂牌价或月租时的简单对照 | 有；没有价格就隐藏对照，不报错 |
| Redfin / Realtor | 无，另 cut |
| DSCR / 贷款 / CapEx / HQS | 无 |
| PHA 90/110% 档位模拟 | 无。工作簿里的 payment standard 列没有打包 |
| 付费墙 | 无 |
| Rightmove CSV / Zillow 成交汇总 | 保持 |

面板用英文显示租金表，解析失败用「无法判定」加原因。免责声明写明：不是投资建议，FMR 不是实际可收租金，也不是住房机构的 payment standard，以 HUD USER 原文为准。

卧室数没有被页面唯一标出时，不默认某一档（例如不默认 2 卧室）。这时若有价格，只把价格和整张 0–4 表放在一起。月租且卧室数在 0–4 时，才计算「月租 − 该档 FMR」。出售挂牌价不和月租做减法。卧室数大于 4 时不外推。

## HUD 数据来源

打包文件：`src/data/hud-fy2027-safmr.js`（38,601 个 ZIP）。生成脚本：`scripts/pack-hud-safmr.py`。

| 项 | 值 |
| --- | --- |
| 财政年度 | FY 2027（一般自 2026-10-01 起；个别复议地区可能仍沿用上一财年有效表，以 HUD 页面为准） |
| 种类 | Small Area FMR（ZIP × 0–4 卧室） |
| 说明页 | https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html |
| 数据集页 | https://www.huduser.gov/portal/datasets/fmr.html |
| 工作簿 | https://www.huduser.gov/portal/datasets/fmr/fmr2027/FY27_safmrs.xlsx |
| 观察到的 HTTP Last-Modified | 2026-08-31 |
| SHA-256 | `532d862a0a95ebb6ef7ff35a9a12924d2451a5fc985ca57a83fc334f229f0a8a` |

只打包 ZIP 与 SAFMR 0BR–4BR。同一 ZIP 若出现在多个 HUD 区域且金额相同，面板显示这一组金额并注明区域不止一个。金额若不一致，打包脚本会失败而不是挑一个。公开表没有的 ZIP 显示「无法判定：FY 2027 HUD SAFMR 公开表无此 ZIP …」，不编造，也不改走县郡 FMR。

更新：下载上述 xlsx 后运行 `python3 scripts/pack-hud-safmr.py <文件>`（需要 openpyxl）。脚本会核对 35096、10001、90210、00602 四组抽样，并写入新的 SHA-256。抽样里的 35096（0–4 卧室 920 / 960 / 1180 / 1550 / 1550）与 HUD《FY 2027 Small Area Fair Market Rent Schedule》PDF 中的 Anniston-Oxford 行一致。

ZIP 只从标题、h1、地址元素，以及 Zillow homedetails 网址里的「州缩写 + ZIP」读取。页面上没有可识别 ZIP，或出现多个不同 ZIP，都显示「无法判定」及原因，不猜测。

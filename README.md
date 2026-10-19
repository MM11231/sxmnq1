# 哨向模拟器 · 白塔向导路线

2026-10-19：本仓库已补齐本地恢复的白塔玩法源码，包括上一休一、城区地图与立体建筑/线稿切换、四季天气、商店背包礼物、120日年历、节庆探索、哨兵邀约偶遇及逐段序章。

新哨兵的姓名与伤情通过酒馆当前 API 批量生成，程序继续控制数值、外貌与存档；支持整批验证、取消和重试。旧名单与复诊人物保留原身份。真实提供方连接需要玩家在酒馆内测试。

源码在 `src/sxmnq`；角色卡配置和变量脚本在 `src/哨向模拟器`；独立预览在 `src/预览`。`docs/white-tower` 保存各模块说明，其中早期文档的“界面调整/白塔卡源”是恢复前本地目录，现已对应到仓库根目录。

使用 Node.js 24，安装依赖后可构建和验证白塔模块：

```sh
pnpm install
pnpm test:white-tower
pnpm build:white-tower
```

构建输出为 `dist/sxmnq/index.html`、`dist/预览/index.html` 和 `dist/哨向模拟器/脚本/变量结构/index.js`。普通 `pnpm build` 仍沿用原模板完整构建和角色卡打包流程。独立预览本身不包含酒馆 API。

本仓库备份源码和构建产物；不包含玩家聊天、API 密钥、个人配置及本地恢复日志。以下保留原模板说明。

# tavern_helper_template

酒馆助手编写前端界面或脚本的模板.

## 使用方法

无论哪种方式, 请阅读[教程文档](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/)来了解如何使用.

### 仅本地使用

你可以点击网页右上角的绿色 `Code` 按钮-`Download ZIP` 下载本模板的压缩包来只在本地使用

### 作为 Github 仓库

你可以通过以下两种方式中的一种来创建仓库:

- 点击网页右上角绿色 `Use this template` 按钮;
- 或者点击网页右上角的 `fork` 按钮, 但需要手动去 fork 所得仓库的 `Actions` 页面启用自动工作流.

在创建好仓库后, 你需要配置工作流的权限: 前往仓库 `Settings -> Actions -> General` 中将 `Workflow permissions` 设置为 `Read and write permissions`, 并勾选 `Allow GitHub Actions to create and approve pull requests`

## 如果只在本地使用

这意味着:

- 你将不能利用 jsdelivr 实现前端界面或脚本的自动更新;
- 也不能享受本模板提供的自动打包、自动更新功能:
  - 上传代码后, 自动打包 `src` 文件夹中的代码到 `dist` 文件夹中;
  - 自动更新成最新的编写模板, 自动更新酒馆和酒馆助手的参考文件……

但你本地依旧能很方便地使用这个模板.

## 如果创建为新仓库

在创建好仓库后, 你可以把仓库网址发给 AI, 问 AI 该**怎么启用 `core.symlinks`**, 然后克隆到本地使用; 或者, 你可以游玩 [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN) 来学习 git 分支和合并.

#### `.vscode/launch.json` 文件

由于 `.vscode/launch.json` 文件中填写了你的酒馆地址, 你可能需要运行命令来忽略这个更改, 避免你的云酒馆 ip 地址暴露:

```bash
git update-index --skip-worktree .vscode/launch.json
```

### 示例文件夹

请不要删除`示例`文件夹, AI 需要参考其中的代码; 但你可以在 `webpack.config.ts` 中将 54 行左右的 `{示例,src}/` 改为 `src/` 来避免打包它们.

#### 利用 jsdelivr 实现前端界面或脚本的自动更新

由于你所制作的前端界面或脚本将被打包在 github 仓库中, 你将能用 jsdelivr 链接来访问它们, 而这个链接可以在前端界面或脚本中直接使用.

由此你就可以为用户创建这样一个自动更新的前端界面:

```html
<body>
  <script>
    $('body').load('https://testingcf.jsdelivr.net/gh/lolo-desu/lolocard/dist/日记络络/界面/介绍页/index.html')
  </script>
</body>
```

或一个自动更新的脚本:

```typescript
import 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/酒馆助手/场景感/index.js'
```

更多请见于[文档](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/进阶技巧).

### 自动打包、自动更新功能

本仓库在 `.github/workflows` 文件夹中设置了几个 CI 工作流来为你带来自动打包、自动更新功能, 你也可以在网页上方的 `Actions` 中手动运行它们:

**`bundle.yaml`**

- 自动打包 `src` 文件夹中的代码到 `dist` 文件夹中, 并自动递增版本号从而让 jsdelivr 更快更新缓存;
- 自动将 `tavern_sync.yaml` 中[已经配置好了的角色卡、世界书或预设](https://stagedog.github.io/青空莉/工具经验/实时编写角色卡、世界书或预设/)打包成可以被酒馆导入的文件.

**`bump_deps.yaml`**

- 每三天一次, 自动更新第三方库依赖和酒馆助手 `@types` 文件夹.

**`sync_template.yaml`**

- 在你基于模板仓库创建新仓库后, 你的新仓库将不再和模板仓库有关联, 因此我设置了这个工作流用于同步模板仓库的更新 (如编程助手编写规则、MCP、slash_command.txt 文件等):
  - 发现模板仓库更新后, 这个工作流将会自动创建一个 pull request 来同步更新, 而**你需要手动批准 pull request, 因此建议你时常查看 github 的邮件通知;**
  - 如果模板仓库中有文件是你不想继续同步的, 可以在 `.github/.templatesyncignore` 中添加它.

### 打包冲突问题

为了自动更新和打包一些东西, 本项目直接打包源代码在 `dist/` 文件夹中并随仓库上传, 而这会让开发时经常出现分支冲突.

为了解决这一点, 仓库在 `.gitattribute` 中设置了对于 `dist/` 文件夹中的冲突总是使用当前版本. 这不会有什么问题: 在上传后, ci 会将 `dist/` 文件夹重新打包成最新版本, 因而你上传的 `dist/` 文件夹内容如何无关紧要.

为了启用这个功能, 请执行一次以下命令:

```bash
git config --global merge.ours.driver true
```

## 许可证

[Aladdin](LICENSE)

# 文物修复档案协作平台

面向博物馆修复团队的文物病害记录、修复方案、影像版本和审批归档平台。
支持修复师现场断网作业：平板先记录修复步骤、材料用量与影像版本，回馆后按**批次号 + 方案修订号**把离线批次归并进中央档案。

## 离线批次归并规则（现场断网 → 回馆同步）

- 归并键：`batch_no`（批次号）+ `base_revision_no`（平板记录时的方案修订号）。
- **重传幂等**：同一批次恢复网络后可能重传，已归并过（含带冲突）的批次直接沿用首次归并结果，响应标记 `retransmit=true`，步骤/影像不会重复并入。
- **基线未变快进**：中央方案修订号仍等于 `base_revision_no` 时，方案字段改动、修复步骤、材料用量、影像版本整批并入，方案修订号 +1。
- **基线已变挂起**：两个修复师先后改过同一方案（修订号已推进）时，步骤和影像不自动并入，全部挂起待人工裁决。
- **双方改动各留一份**：同一方案字段两侧都改成不同值时做三方合并（基线/中央/离线），三方内容都保留并生成 `OPEN` 冲突，不自动采用任一侧；步骤、影像同样双方各留一份。
- **归档闸门**：方案存在 `OPEN` 冲突时归档接口返回 `409 UNRESOLVED_CONFLICT`；冲突未处理完不能归档，其他查询与修复进度照常可用。
- **失败保留重试**：归并异常时原批次报文保留为 `FAILED` 并记录 `last_error` 与 `attempts`，用同一批次号修正后重提即可重试。
- 冲突裁决：`KEEP_CENTRAL` 保留中央侧（离线侧丢弃）；`KEEP_OFFLINE` 采用离线侧并把字段/步骤/影像写入中央档案，修订号随之推进。全部裁决完批次转为 `MERGED`，方案方可归档。

### 离线归并接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/offline-batch` | 回馆上报/重传/重试一个离线批次（按 `batch_no` 幂等） |
| GET | `/api/offline-batch` | 批次列表（含状态、attempts、last_error） |
| GET | `/api/offline-batch/results?batchNo=` | 归并结果（首次结果；重传响应带 `retransmit=true`） |
| GET | `/api/merge-conflict?batchNo=&planId=` | 冲突清单（base/central/offline 三份内容） |
| POST | `/api/merge-conflict/:id/resolve` | 裁决冲突：`KEEP_CENTRAL` / `KEEP_OFFLINE` |
| POST | `/api/restoration-plan/:id/archive` | 方案归档（有未决冲突返回 409） |

后端规则用例：`cd backend && npm test`（幂等重传、基线快进、双方冲突、归档闸门、裁决并入、失败重试等 8 个用例）。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20110>

后端健康检查：<http://localhost:21110/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Ant Design + Zustand |
| 后端 | NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL 15 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `relic-restore`
- `FRONTEND_PORT`: 前端端口，默认 `20110`
- `BACKEND_PORT`: 后端端口，默认 `21110`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: relic-restore`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-relic-restore}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- RelicCondition: constants/RelicCondition、types/RelicCondition、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- PlanApprovalStatus: constants/PlanApprovalStatus、types/PlanApprovalStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- DamageSeverity: constants/DamageSeverity、types/DamageSeverity、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- OfflineBatchStatus（PENDING / MERGED / MERGED_WITH_CONFLICTS / FAILED）：
  - 后端：`constants/OfflineBatchStatus.ts`、`types/OfflineBatchPayload.ts`、`repositories/OfflineBatchRepository.ts`、`services/offlineMergeEngine.ts`、`services/OfflineBatchService.ts`、`constructors/OfflineBatchDtoFactory.ts`、`__tests__/offlineMerge.test.ts`
  - 前端：`constants/OfflineBatchStatus.ts`、`constants/offlineSyncText.ts`、`types/OfflineBatch.ts`、`stores/OfflineBatchStore.ts`、`pages/OfflineSyncPage.tsx`
- MergeConflictStatus（OPEN / RESOLVED / DISCARDED）：后端 `constants/MergeConflictStatus.ts`、`types/MergeConflictPayload.ts`、`repositories/MergeConflictRepository.ts`、`services/MergeConflictService.ts`；前端 `constants/MergeConflictStatus.ts`、`types/MergeConflict.ts`、`components/common/ConflictPanel.tsx`。
- MergeConflictType（PLAN_FIELD / STEP / IMAGE）与 MergeConflictResolution（KEEP_CENTRAL / KEEP_OFFLINE）：后端 `constants/MergeConflictType.ts`、`constants/MergeConflictResolution.ts`、`services/offlineMergeEngine.ts`、`services/MergeConflictService.ts`；前端 `constants/MergeConflictResolution.ts`、`constants/offlineSyncText.ts`、`api/MergeConflict.ts`。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT

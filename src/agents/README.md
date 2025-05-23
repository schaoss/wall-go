# agents/ 說明

- `PlayerAgent.ts`：玩家代理介面，AI/真人皆實作 getAction
- `HumanAgent.ts`：真人代理，UI 輸入時呼叫 submitAction
- `RandomAiAgent.ts`：隨機合法行動 AI 代理
- `index.ts`：代理總匯

主流程可依據玩家順序，依序呼叫 agent.getAction(gameState) 取得行動。

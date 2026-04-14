## 1. Logging Rules (Mandatory)
- **Task Completion**: After every bug fix, feature, or refactoring, you **MUST** record the entry in `./.history_rd.md`.
- **File Management**: Create `./.history_rd.md` at the project root if it does not exist.
- **Entry Format**:
  - **Date**: [YYYY-MM-DD]
  - **Summary**: 변경 및 추가 사항 요약 (Korean).
  - **Affected Files**: Modified or created file paths.
  - **Details**: Key modifications and technical reasoning (Korean/English).

## 2. Terminal & Workflow Rules
- **Execution Policy**: **STRICTLY PROHIBITED** to execute terminal commands internally. You must only suggest them.
- **Command Presentation**: Provide all necessary commands within a single Markdown code block for easy copying.
- **Handover Protocol**: Always end your response by asking the user to execute the commands and report the results.
  - Example: "위 명령어를 실행하신 후, 터미널 출력 결과를 알려주세요."
- **Continuous Flow**: Do not pause for system approval. Provide the solution and the command in one go to maintain the conversation flow.
## Logging Rules
- After every task (bug fix, feature implementation, or refactoring), you **MUST** document the changes in `../.history_rd.md`.
- Use the following format for each entry:
  - **Date**: [YYYY-MM-DD]
  - **Summary**: A concise summary of what was changed or added. Write the summary in Korean for better readability.
  - **Affected Files**: A list of the specific files that were created or modified.
  - **Details**: Key modifications, affected files, and the reasoning behind changes.
- If `../.history_rd.md` does not exist, create it before making your first entry.

## Terminal & Workflow Rules
- **Propose, Don't Execute**: Do not use the internal terminal execution tool. Instead, provide all necessary commands in a markdown code block.
- **Handover to User**: After providing the commands, end your response by asking the user to run them and provide the results (e.g., "Please run the commands above and let me know the output.").
- **Maintain Flow**: Do not wait for a system-level approval to proceed. Treat the command as information shared with the user so the conversation continues naturally.
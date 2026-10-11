# JamesUINext repository guidelines

- **Only repository:** \`MarkusAureliusTeuton/JamesUINext\`; default branch \`main\`. Do not access or modify external project repositories.
- **First read:** \`PROJECT_STATUS.md\`, \`README.md\`, \`docs/DASHBOARD_1_0_RELEASE_GATE.md\`, and relevant source/tests from the actual current HEAD.
- **Project:** Standalone Home Assistant integration \`jamesui_next\`, panel \`/jamesui-next\`, storage key \`jamesui_next.config\`, static root \`/jamesui_next_static\`.
- **Current scope:** Complete and validate the Home/Start dashboard and Core: weather, agenda/todos, house quick info, dynamic buttons, grid/editing. Other pages stay out of scope.
- **Testing:** Make targeted changes, add realistic regression tests, use GitHub Actions. Mock/Chromium evidence is not physical Home Assistant or OnePlus Pad 2/Fully acceptance.
- **Assets:** All required images are already in this repository. Never import them from another repository.
- **Delivery:** Keep documentation honest, update \`PROJECT_STATUS.md\` after material changes, preserve traceable commits and a simple HACS release path.
- **Communication:** German, concise status and next actions. Avoid reopening approved work, adding speculative modules or repeating background.

# CommNG - Massachusetts National Guard Communications App


## Backend Folder Structure:
```bash
.
├── biome.json
├── package-lock.json
├── package.json
├── src
│   ├── data      # everything related to databases
│   ├── index.ts  # entrypoint to application
│   ├── routers   # routers for each type of action (communication, mentorship, reports, etc.)
│   ├── service   # service layer holds the business logic
│   ├── trpc      # trpc-related config
│   ├── types     # types/zod validators for nice type safety
│   └── utils     # utilities (logger, trpc-ui, etc.)
├── test
│   └── hello.test.ts # a basic vitest sample
│   └── reports.test.ts # a more advanced test with mocks
└── tsconfig.json
```
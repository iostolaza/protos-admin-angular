
# Protos Admin Angular

A basic Angular admin dashboard starter project with top bar, navigation sidebar, and main content section. Built with Angular 18+, standalone components, routing, and Angular Material for UI. Integrated with AWS Amplify for authentication, data, and storage.

## Functionality
- Responsive layout with header, sidebar, and router-outlet for main content.
- Example routes: Dashboard (extendable for features like maps), Analytics, Calendar, Home, Profile, Settings, Auth, Contacts, Messages, Schedule, Timesheet.
- State management with signals; OnPush change detection for performance.
- Authentication via AWS Amplify (email login, user pools).
- Data models (e.g., UserSettings with theme, preferences, profile pictures).
- Storage for private/public files.
- Icon preloading and layout services.
- Dark/light mode support with Tailwind CSS.
- Heroicons for UI elements.

## Dependencies
From package.json:
- Angular: ^20.1.0 (core, common, compiler, forms, platform-browser, router)
- AWS Amplify: ^6.15.5 (backend, backend-cli, ui-angular)
- RxJS: ~7.8.0
- Tailwind CSS: ^4.1.11 (with PostCSS and Autoprefixer)
- Other dev: TypeScript ^5.8.3, Jasmine/Karma for testing, esbuild ^0.25.8, etc.

Full list in package.json.

## Installation
1. Clone the repo: \`git clone https://github.com/iostolaza/protos-admin-angular\`
2. Install dependencies: \`npm install\`
3. For AWS Amplify setup:
   - Install Amplify CLI: \`npm install -g @aws-amplify/cli@latest\`
   - Configure: \`amplify configure\`
   - Initialize Amplify: \`amplify init\`
   - Add auth/data/storage as per amplify/ directory scripts.
4. Run dev server: \`ng serve\` (access at http://localhost:4200)

## Running
- Development server: \`ng serve\`
- Production build: \`ng build --prod\`

## Testing
- Unit tests: \`ng test\` (uses Karma and Jasmine)
- End-to-end tests: \`ng e2e\` (requires additional setup, e.g., Cypress or Protractor)

## License
MIT - See [LICENSE.md](LICENSE.md) for details.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.0.

## Code Scaffolding
Angular CLI includes powerful code scaffolding tools. To generate a new component, run:
\`ng generate component component-name\`

For a complete list of available schematics (such as components, directives, or pipes), run:
\`ng generate --help\`

## Building
To build the project run:
\`ng build\`

This will compile your project and store the build artifacts in the dist/ directory. By default, the production build optimizes your application for performance and speed.

## Additional Resources
For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
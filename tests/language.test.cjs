/**
 * @link      https://github.com/monarc-project for the canonical source repository
 * @copyright Copyright (c) 2016-2026 Luxembourg House of Cybersecurity LHC.lu - Licensed under GNU Affero GPL v3
 * @license   MONARC is licensed under GNU Affero General Public License version 3
 */

const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const {before, after, test} = require('node:test');
const {chromium} = require('@playwright/test');
const root = path.resolve(__dirname, '..');
const modules = path.join(root, 'node_modules');
const sources = Object.fromEntries(
    ['BackofficeApp', 'ConfigService', 'UserService', 'BackofficeMainCtrl'].map(name => [
        name, readFileSync(path.join(root, 'src', `${name}.js`), 'utf8')
    ])
);
const translations = process.env.MONARC_BO_TRANSLATIONS
    || path.resolve(root, '../MonarcAppBO/public/js/translations.js');
const historyLabelCell = readFileSync(path.join(root, 'views/logs.admin.html'), 'utf8')
    .match(/<td md-cell><a ui-sref=.*?<\/a><\/td>/)[0];
let browser;
before(async () => { browser = await chromium.launch({headless: true}); });
after(async () => { await browser?.close(); });

async function screen(t, {defaultLanguage = 1, uiLanguage = 'fr', dataLanguage = 1} = {}) {
    const page = await browser.newPage();
    t.after(() => page.close());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent(`<!doctype html><html><body>
        <main ng-controller="BackofficeMainCtrl">
            <button ng-click="changeLanguage('de')">German</button>
            <button ng-click="changeLanguage('en')">English</button>
            <button ng-click="changeLanguage('es')">Spanish</button>
            <span id="label-heading" translate>Label</span>
            <span id="type">{{ 'Primary' | translate }}</span>
            <table><tr ng-repeat="asset in assets" data-record="{{$index}}">
                <td class="label">{{ _langField(asset, 'label') }}</td>
                <td class="description">{{ _langField(asset, 'description') }}</td>
            </tr></table>
            <table id="history"><tr ng-repeat="log in assets">${historyLabelCell}</tr></table>
        </main>
    </body></html>`);
    for (const file of ['angular/angular.js', 'angular-gettext/dist/angular-gettext.js', 'iso-639-1/build/index.js']) {
        await page.addScriptTag({path: path.join(modules, file)});
    }
    await page.addScriptTag({path: translations});
    await page.evaluate(({sources, defaultLanguage, uiLanguage, dataLanguage}) => {
        // Load the real application run block without unrelated routes/providers.
        const moduleFactory = angular.module;
        let run;
        const registration = {config() { return this; }, run(definition) { run = definition; return this; }};
        angular.module = () => registration;
        window.eval(sources.BackofficeApp);
        angular.module = moduleFactory;
        const module = angular.module('BackofficeApp', ['gettext']);
        window.storage = {
            auth_token: 'isolated-language-fixture', uid: 1, permission_groups: '[]',
            uiLanguage, dataLanguage
        };
        module.value('localStorageService', {
            get: key => window.storage[key] ?? null,
            set: (key, value) => { window.storage[key] = value; }
        });
        module.factory('$http', ['$q', function ($q) {
            return {get: url => $q.resolve(url === 'api/config' ? {data: {
                languages: {1: 'French', 2: 'English', 3: 'German'},
                defaultLanguageIndex: defaultLanguage, uiLanguageCodes: ['fr', 'en', 'de', 'es']
            }} : {status: 200, data: {roles: [{role: 'sysadmin'}]}})};
        }]);
        module.value('$state', {transitionTo() {}});
        module.value('$mdSidenav', () => ({open() {}, close() {}}));
        module.value('$mdMedia', () => false);
        for (const name of ['ConfigService', 'UserService', 'BackofficeMainCtrl']) {
            window.eval(sources[name]);
        }
        module.run(run);
        module.run(['$rootScope', 'gettextCatalog', 'UserService', function ($rootScope, catalog, user) {
            $rootScope.assets = [
                {label1: 'Actif français', description1: 'Description française',
                    label2: 'English asset', description2: 'English description',
                    label3: 'Deutscher Wert', description3: 'Deutsche Beschreibung'},
                {label1: 'Sans traduction', description1: 'Description par défaut',
                    label2: 'No translation', description2: 'Default description', label3: '', description3: null},
                {label1: 'Description manquante', description1: 'Description française conservée',
                    label2: 'Missing description', description2: 'English fallback',
                    label3: 'Deutscher Titel', description3: ''}
            ];
            window.originalAssets = angular.toJson($rootScope.assets);
            window.languageEvents = [];
            $rootScope.$on('languageChanged', () => {
                window.languageEvents.push({ui: catalog.getCurrentLanguage(), data: user.getDataLanguage()});
            });
        }]);
        window.injector = angular.bootstrap(document.body, ['BackofficeApp']);
    }, {sources, defaultLanguage, uiLanguage, dataLanguage});
    await page.waitForFunction(() => document.querySelectorAll('[data-record]').length === 3);
    return {page, errors};
}

test('UI language selects database translations per record and field, with the configured default fallback', async t => {
    const {page, errors} = await screen(t);
    await page.getByRole('button', {name: 'German', exact: true}).click();
    assert.deepEqual(await page.locator('.label').allTextContents(), [
        'Deutscher Wert', 'Sans traduction', 'Deutscher Titel'
    ]);
    assert.deepEqual(await page.locator('.description').allTextContents(), [
        'Deutsche Beschreibung', 'Description par défaut', 'Description française conservée'
    ]);
    assert.deepEqual(await page.locator('#history a').allTextContents(), [
        'Deutscher Wert', 'Sans traduction', 'Deutscher Titel'
    ]);
    assert.equal(await page.locator('#label-heading').textContent(), 'Bezeichnung');
    assert.equal(await page.locator('#type').textContent(), 'Primär');
    assert.deepEqual(await page.evaluate(() => window.languageEvents), [{ui: 'de', data: 3}]);
    assert.equal(await page.evaluate(() => window.storage.uiLanguage), 'de');
    assert.equal(await page.evaluate(() => angular.toJson(injector.get('$rootScope').assets) === originalAssets), true);
    await page.getByRole('button', {name: 'English', exact: true}).click();
    assert.deepEqual(await page.locator('.label').allTextContents(), [
        'English asset', 'No translation', 'Missing description'
    ]);
    assert.deepEqual(errors, []);
});

test('a restored UI preference overrides the account data language and respects a non-French default', async t => {
    const {page, errors} = await screen(t, {defaultLanguage: 2, uiLanguage: 'de', dataLanguage: 1});
    assert.deepEqual(await page.locator('.label').allTextContents(), [
        'Deutscher Wert', 'No translation', 'Deutscher Titel'
    ]);
    assert.deepEqual(await page.locator('.description').allTextContents(), [
        'Deutsche Beschreibung', 'Default description', 'English fallback'
    ]);
    assert.equal(await page.locator('#label-heading').textContent(), 'Bezeichnung');
    assert.equal(await page.evaluate(() => injector.get('UserService').getDataLanguage()), 3);
    assert.deepEqual(errors, []);
});

test('a UI-only language uses the default database language and numeric-index callers still work', async t => {
    const {page, errors} = await screen(t);
    await page.getByRole('button', {name: 'Spanish', exact: true}).click();
    assert.deepEqual(await page.locator('.label').allTextContents(), [
        'Actif français', 'Sans traduction', 'Description manquante'
    ]);
    assert.deepEqual(await page.evaluate(() => ({
        ui: injector.get('gettextCatalog').getCurrentLanguage(),
        index: injector.get('UserService').getDataLanguage(),
        numeric: injector.get('ConfigService').getDataLanguageIndex(3),
        numericString: injector.get('ConfigService').getDataLanguageIndex('3')
    })), {ui: 'es', index: 1, numeric: 3, numericString: 3});
    assert.deepEqual(errors, []);
});

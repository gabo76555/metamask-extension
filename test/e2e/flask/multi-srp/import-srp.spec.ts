import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { SECOND_TEST_E2E_SRP, withMultiSRP } from './common-multi-srp';

describe('Multi SRP - Import SRP', function (this: Suite) {
  const testPassword = 'correct horse battery staple';
  it('successfully imports a new srp', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        // Check if the SRP was imported successfully
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await driver.waitForSelector({
          text: 'SRP #2',
        });
      },
    );
  });

  it('successfully imports a new srp and it matches the srp imported', async function () {
    await withMultiSRP(
      { title: this.test?.fullTitle() },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.startExportSRPForAccount('Account 2');

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });
});

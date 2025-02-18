const { strict: assert } = require('assert');
const {
  createInternalTransaction,
  createDappTransaction,
  createInternalTransactionWithMaxAmount,
} = require('../../page-objects/flows/transaction');

const {
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Editing Confirm Transaction', function () {
  it('allows selecting high, medium, low gas estimates on edit gas fee popover', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransaction(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        // update estimates to high
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        await driver.waitForSelector({
          text: 'sec',
          tag: 'span',
        });
        await driver.clickElement(
          '[data-testid="edit-gas-fee-item-high"] > span:first-child',
        );

        await driver.waitForSelector({
          text: 'Aggressive',
        });

        // update estimates to medium
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        await driver.clickElement(
          '[data-testid="edit-gas-fee-item-medium"] > span:first-child',
        );

        await driver.waitForSelector({
          text: 'Market',
        });

        // update estimates to low
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        await driver.clickElement(
          '[data-testid="edit-gas-fee-item-low"] > span:first-child',
        );

        await driver.waitForSelector({
          text: 'Slow',
        });
        await driver.waitForSelector('[data-testid="inline-alert"]');

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('allows accessing advance gas fee popover from edit gas fee popover', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransaction(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        // update estimates to high
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        await driver.waitForSelector({
          text: 'sec',
          tag: 'span',
        });
        await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

        // enter max fee
        await driver.fill('[data-testid="base-fee-input"]', '8.5');

        // enter priority fee
        await driver.fill('[data-testid="priority-fee-input"]', '8.5');

        // save default values
        await driver.clickElement('input[type="checkbox"]');

        // edit gas limit
        await driver.clickElement('[data-testid="advanced-gas-fee-edit"]');
        await driver.fill('[data-testid="gas-limit-input"]', '100000');

        // Submit gas fee changes
        await driver.clickElement({ text: 'Save', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0002 ETH',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$0.30',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('adjusts max send amount based on gas fluctuations', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransactionWithMaxAmount(driver);

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,499.25',
          tag: 'p',
        });

        // update estimates to high
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        await driver.waitForSelector({
          text: 'sec',
          tag: 'span',
        });
        await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

        // enter max fee
        await driver.fill('[data-testid="base-fee-input"]', '50000');

        // enter priority fee
        await driver.fill('[data-testid="priority-fee-input"]', '3000');

        // edit gas limit
        await driver.clickElement('[data-testid="advanced-gas-fee-edit"]');
        await driver.fill('[data-testid="gas-limit-input"]', '500000');

        // Submit gas fee changes
        await driver.clickElement({ text: 'Save', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0634 ETH',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$107.79',
        });

        // verify max amount after gas fee changes
        await driver.waitForSelector({
          text: '$42,392.21',
          tag: 'p',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        const txValuesCurrency = await driver.findElements(
          '[data-testid="transaction-list-item-secondary-currency"]',
        );

        assert.equal(txValues.length, 1);
        const ethValueText = await txValues[0].getText();
        const usdValueText = await txValuesCurrency[0].getText();

        assert.strictEqual(
          ethValueText.trim(),
          '-24.93659167 ETH',
          `ETH value mismatch: Expected "-24.93659167 ETH", but got "${ethValueText}"`,
        );

        assert.strictEqual(
          usdValueText.trim(),
          '-$42,392.21 USD',
          `USD value mismatch: Expected "-$42,392.21 USD", but got "${usdValueText}"`,
        );
      },
    );
  });

  it('should use dapp suggested estimates for transaction coming from dapp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        dapp: true,
      },
      async ({ driver }) => {
        // login to extension
        await unlockWallet(driver);

        await createDappTransaction(driver, {
          maxFeePerGas: '0x2000000000',
          maxPriorityFeePerGas: '0x1000000000',
        });

        // check transaction in extension popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          text: 'Site suggested',
        });

        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
        // -- should render the popover with no error
        // this is to test in MV3 a racing issue when request for suggestedGasFees is not fetched properly
        // some data would not be defined yet
        await driver.waitForSelector('.edit-gas-fee-popover');
        await driver.clickElement(
          '[data-testid="edit-gas-fee-item-dappSuggested"]',
        );

        await driver.findElements({
          css: 'h2',
          text: '0.001 ETH',
        });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0019',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$3.15',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // transaction should correct values in activity tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-0.001\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});

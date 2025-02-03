import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { commonSolanaAddress, withSolanaAccountSnap } from './common-solana';

const splTokenName = 'PKIN';
describe('Send flow', function (this: Suite) {
  // skipped due tohttps://github.com/MetaMask/snaps/issues/3019
  it('user with more than 1 token in the token list', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
        isNative: false,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await console.log('openTokenList');
        await sendSolanaPage.openTokenList();
        await console.log('check_tokenByNameIsDisplayed SOL');
        await sendSolanaPage.check_tokenByNameIsDisplayed('SOL');

        await sendSolanaPage.check_tokenByNameIsDisplayed(splTokenName);

        await sendSolanaPage.selectTokenFromTokenList(splTokenName);

        await sendSolanaPage.check_amountCurrencyIsDisplayed(splTokenName);
        await sendSolanaPage.check_tokenBalanceIsDisplayed('6', splTokenName);
        await sendSolanaPage.setAmount('0.1');
        await sendSolanaPage.clickOnContinue();

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await sendSolanaPage.clickOnContinue();
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1', splTokenName),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed and it should',
        );

        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await sentTxPage.check_TransactionStatusText('0.1', true, splTokenName),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.check_TransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );

        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });
});
describe('Send full flow of SOL', function (this: Suite) {
  it('with a positive balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          true,
          'Swap button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          true,
          'Bridge button is not enabled and it should',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await sendSolanaPage.setAmount('0.1');
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await sendSolanaPage.clickOnContinue();
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1'),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed and it should',
        );
        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await sentTxPage.check_TransactionStatusText('0.1', true),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.check_TransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });
});
describe('Send flow', function (this: Suite) {
  it('and Transaction fails', async function () {
    this.timeout(120000); // there is a bug open for this big timeout https://consensyssoftware.atlassian.net/browse/SOL-90
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: false,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.clickOnSendButton();

        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.check_pageIsLoaded();
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        await sendSolanaPage.setAmount('0.1');
        // assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnSend();
        const failedTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await failedTxPage.check_TransactionStatusText('0.1', false),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await failedTxPage.check_TransactionStatus(false),
          true,
          'Transaction did not fail as expected',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed and it should',
        );
      },
    );
  });
});

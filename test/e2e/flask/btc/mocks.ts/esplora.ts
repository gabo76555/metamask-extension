import { Mockttp } from 'mockttp';

const ESPLORA_URL = 'https://blockstream.info/api';
const ESPLORA_SCRIPTHASH_REGEX =
  /^https:\/\/blockstream\.info\/api\/scripthash\/[0-9a-f]{64}\/txs$/u;
const SCRIPT_HASHES = [
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721',
  'd46079253e1fe44c9441e9927f3be4145e4634e1b8378cf6d5b0ebba98813216',
  '98c2bcc9358f44e43b023f7b8fbe6571441b49e45d75bad63dba2dea834f19a7',
];

const mockBlocks = (mockServer: Mockttp) =>
  mockServer.forGet(`${ESPLORA_URL}/blocks`).thenCallback(() => ({
    statusCode: 200,
    json: [
      {
        id: '000000000000000000021db6a261dda16e3f27c452e0c204b23d59f2613cd04c',
        height: 887763,
        version: 1073676288,
        timestamp: 1741950277,
        tx_count: 3566,
        size: 1651280,
        weight: 3993557,
        merkle_root:
          '5aacadbd045e88ea5ba2bb0d0aee30644023dc852938a2250fd77dad0189472e',
        previousblockhash:
          '00000000000000000001a685990ab871a9e9be147f59812ae844f859283cf088',
        mediantime: 1741945781,
        nonce: 246132581,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '00000000000000000001a685990ab871a9e9be147f59812ae844f859283cf088',
        height: 887762,
        version: 754696192,
        timestamp: 1741949338,
        tx_count: 3105,
        size: 1480943,
        weight: 3993548,
        merkle_root:
          '2b725c0f22e3b059596a53e13fd29d3adee29a7c5a3ec30c5d9cb4b8a9e7261e',
        previousblockhash:
          '0000000000000000000109c1a305a19da7fee96092021a1a7fe7363386279ab1',
        mediantime: 1741945773,
        nonce: 719962452,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '0000000000000000000109c1a305a19da7fee96092021a1a7fe7363386279ab1',
        height: 887761,
        version: 804413440,
        timestamp: 1741948491,
        tx_count: 4253,
        size: 1677299,
        weight: 3993575,
        merkle_root:
          'e83f599abbdcd2a09e96670006e8a93fbee5e5642947ab463b55d1637e1d661d',
        previousblockhash:
          '0000000000000000000034323dc3fa671060b93ba3a421c27cba39ceb1de8843',
        mediantime: 1741945166,
        nonce: 517023298,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '0000000000000000000034323dc3fa671060b93ba3a421c27cba39ceb1de8843',
        height: 887760,
        version: 831963136,
        timestamp: 1741946442,
        tx_count: 2084,
        size: 1929984,
        weight: 3993432,
        merkle_root:
          'f3a5b19bb7884df6ad1ca4a474122f9e0587bc3b85032d8c38f29bab95c8e973',
        previousblockhash:
          '00000000000000000001123b630d39c91e4c5dcde69c54134cc0bbd0332e9115',
        mediantime: 1741944725,
        nonce: 947916899,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '00000000000000000001123b630d39c91e4c5dcde69c54134cc0bbd0332e9115',
        height: 887759,
        version: 706740224,
        timestamp: 1741946076,
        tx_count: 1251,
        size: 1751958,
        weight: 3993528,
        merkle_root:
          '33bb0ddb000c63ec61ba9e0ddc54e32bf84b014b2954a552e57677f32caadd07',
        previousblockhash:
          '00000000000000000001408a02d31da68a817fec8483e5d0230c9a054083bc3d',
        mediantime: 1741943549,
        nonce: 2469229960,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '00000000000000000001408a02d31da68a817fec8483e5d0230c9a054083bc3d',
        height: 887758,
        version: 872415232,
        timestamp: 1741945781,
        tx_count: 613,
        size: 1994608,
        weight: 3993517,
        merkle_root:
          'd8972b9df4bb61c5be2f7d58e54332d69007cc53f86e29c5c9137631e0c97b6f',
        previousblockhash:
          '000000000000000000027277f2bb1b2800ec8f6c193fb2f315d224e9167449ec',
        mediantime: 1741942539,
        nonce: 3395599209,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '000000000000000000027277f2bb1b2800ec8f6c193fb2f315d224e9167449ec',
        height: 887757,
        version: 610516992,
        timestamp: 1741945773,
        tx_count: 2050,
        size: 1858224,
        weight: 3993585,
        merkle_root:
          'ba867961dd6221c444a4097c5482ef8a0510a7b70ff5c50f815d2c71565fbcdb',
        previousblockhash:
          '000000000000000000003b14929b0adc5471bc0a86b75e90470fad671265a82a',
        mediantime: 1741941813,
        nonce: 1079579948,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '000000000000000000003b14929b0adc5471bc0a86b75e90470fad671265a82a',
        height: 887756,
        version: 537149440,
        timestamp: 1741945166,
        tx_count: 1773,
        size: 1960675,
        weight: 3993697,
        merkle_root:
          '08780e40338229610196839f08fe97d63f43118732d1e2a27dc134c0a3b1008e',
        previousblockhash:
          '00000000000000000001b9a974ead95fe0e63e5fb814696e6e08ce867a4f5e1a',
        mediantime: 1741941724,
        nonce: 139779852,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '00000000000000000001b9a974ead95fe0e63e5fb814696e6e08ce867a4f5e1a',
        height: 887755,
        version: 536870912,
        timestamp: 1741944725,
        tx_count: 3345,
        size: 1689981,
        weight: 3993564,
        merkle_root:
          '3cdaf81ee75473376ab8d98c7a21be1328e297ba6a0359d587f326636337b800',
        previousblockhash:
          '0000000000000000000163ae1ab6b21bb03c0e51a890be4449a019b52a147885',
        mediantime: 1741940909,
        nonce: 4096688158,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
      {
        id: '0000000000000000000163ae1ab6b21bb03c0e51a890be4449a019b52a147885',
        height: 887754,
        version: 537853952,
        timestamp: 1741943549,
        tx_count: 3124,
        size: 1650915,
        weight: 3993909,
        merkle_root:
          'de7ccff11839f98848893a5bd92f5361e6b6b91a22dc0b9b0e8dd28909ff5721',
        previousblockhash:
          '000000000000000000024e0490547c1878fcc4f018d70c6d0897f79c76de2888',
        mediantime: 1741940743,
        nonce: 3819108766,
        bits: 386040449,
        difficulty: 112149504190349.28,
      },
    ],
  }));

const mockGenesisHeight = (mockServer: Mockttp) =>
  mockServer.forGet(`${ESPLORA_URL}/block-height/0`).thenCallback(() => ({
    statusCode: 200,
    json: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
  }));

const mockAnyTxs = (mockServer: Mockttp) =>
  mockServer.forGet(ESPLORA_SCRIPTHASH_REGEX).thenCallback(() => ({
    statusCode: 200,
    json: [],
  }));

/**
 * Mocks the Esplora calls needed for an initial full scan for a bitcoin balance of 1 BTC
 * @param mockServer The mock server
 */
export async function mockInitialFullScan(mockServer: Mockttp) {
  await mockBlocks(mockServer);
  await mockAnyTxs(mockServer);
  await mockGenesisHeight(mockServer);
}

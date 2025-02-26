import {
  SampleGasPricesController,
  SampleGasPricesControllerMessenger,
  SampleGasPricesControllerState,
  SampleGasPricesService,
} from '../../controllers/sample';
import { ControllerInitFunction } from '../types';

export const SampleGasPricesControllerInit: ControllerInitFunction<
  SampleGasPricesController,
  SampleGasPricesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SampleGasPricesController({
    messenger: controllerMessenger,
    state: persistedState as unknown as Partial<SampleGasPricesControllerState>,
    gasPricesService: new SampleGasPricesService({ fetch }),
  });

  return {
    controller,
  };
};

export type HepsijetTokenResponse = {
  status: string;
  data?: {
    id?: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    language?: string;
    token: string;
    company?: { name?: string; abbreviationCode?: string };
  };
  message?: string;
};

export type HepsijetCreateShipmentResponse = {
  status: string;
  data?: {
    customerDeliveryNo?: string;
    zplBarcodeDTOList?: Array<{
      trackingUrl?: string;
      barcodeNo?: string;
    }>;
  };
  message?: string;
  detailStatus?: string;
  errorCode?: string;
  invalidFields?: string[];
};

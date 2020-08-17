const maxios = require("axios").default;

const Instamojo = require("../Instamojo");

const paymentId = "MOJO0816705N15845280";
const paymentRequestId = "0cb066f9d3764c2fab6da469d8f613ss";
const buyerPhone = "+919900000000";
const promiseRejectResponse = {
  response: { data: { success: false, message: "Error message" } },
};
afterEach(() => {
  jest.clearAllMocks();
});

describe("Initial setup", () => {
  test("Should set to Production mode", () => {
    Instamojo.isSandboxMode(false);
    expect(maxios.defaults.baseURL).toEqual(
      "https://www.instamojo.com/api/1.1"
    );
  });

  test("Should set to Sandbox mode", () => {
    Instamojo.isSandboxMode(true);
    expect(maxios.defaults.baseURL).toEqual(
      "https://test.instamojo.com/api/1.1"
    );
  });

  test("Should set API and AUTH keys", () => {
    Instamojo.setKeys("test_5ede_API_KEY", "test_474_AUTH_KEY");

    expect(maxios.defaults.headers.common["X-Api-Key"]).toEqual(
      "test_5ede_API_KEY"
    );
    expect(maxios.defaults.headers.common["X-Auth-Token"]).toEqual(
      "test_474_AUTH_KEY"
    );
  });
});

const removeExtraSpaces = (s) => {
  return s.replace(/\s+/g, " ").trim();
};

describe("Create payment request", () => {
  test("Should return valid peymentData", () => {
    const wrongPaymentData = Instamojo.PaymentData({
      purpose: "Product name",
      amount: 0,
    });
    const rightPaymentData = Instamojo.PaymentData({
      purpose: "Product name",
      amount: 20,
    });

    expect(removeExtraSpaces(wrongPaymentData.message)).toBe(
      removeExtraSpaces(`Purpose and Amount are mandatory fields. And Amount can't be 0.
      Try something like:
      Instamojo.PaymentData({
        purpose: 'Product name',
        amount: 20
      });`)
    );

    expect(rightPaymentData).toStrictEqual({
      purpose: "Product name",
      amount: 20,
      currency: "INR",
      buyer_name: "",
      email: "",
      phone: null,
      send_email: false,
      send_sms: false,
      allow_repeated_payments: false,
      webhook: "",
      redirect_url: "",
    });
  });

  test("should get new payment request", async () => {
    // * Setup
    const responseObject = {
      data: {
        success: true,
        payment_request: {
          id: paymentRequestId,
          phone: null,
          email: "",
          buyer_name: "",
          amount: "20.00",
          purpose: "Product name",
          expires_at: null,
          status: "Pending",
          send_sms: false,
          send_email: false,
          sms_status: null,
          email_status: null,
          shorturl: null,
          longurl: `https://test.instamojo.com/@user/${paymentRequestId}`,
          redirect_url: "",
          webhook: "",
          allow_repeated_payments: false,
          customer_id: null,
          created_at: "2020-08-16T08:26:26.382335Z",
          modified_at: "2020-08-16T08:26:26.382353Z",
        },
      },
    };
    maxios.post.mockImplementationOnce(() => Promise.resolve(responseObject));
    maxios.post.mockImplementationOnce(() =>
      Promise.reject(promiseRejectResponse)
    );

    // * Work
    const paymentData = Instamojo.PaymentData({
      purpose: "Product name",
      amount: 20,
    });
    const response = await Instamojo.createNewPaymentRequest(paymentData);
    const rejectedResponse = await Instamojo.createNewPaymentRequest(
      paymentData
    );

    // * Assert
    expect(response).toStrictEqual(responseObject.data);
    expect(rejectedResponse).toStrictEqual(promiseRejectResponse.response);
    expect(maxios.post).toHaveBeenCalledTimes(2);
    expect(maxios.post).toHaveBeenCalledWith("/payment-requests", {
      allow_repeated_payments: false,
      amount: 20,
      buyer_name: "",
      currency: "INR",
      email: "",
      phone: null,
      purpose: "Product name",
      redirect_url: "",
      send_email: false,
      send_sms: false,
      webhook: "",
    });
  });
});

describe("should get payment details", () => {
  test("Should get Payment Request Status", async () => {
    const statusResponseObject = {
      success: true,
      payment_request: {
        id: paymentRequestId,
        phone: null,
        email: "",
        buyer_name: "",
        amount: "20.00",
        purpose: "Product name",
        expires_at: null,
        status: "Completed",
        send_sms: false,
        send_email: false,
        sms_status: null,
        email_status: null,
        shorturl: null,
        longurl: `https://test.instamojo.com/@USER/${paymentRequestId}`,
        redirect_url: "",
        webhook: "",
        payments: [
          {
            payment_id: paymentId,
            status: "Credit",
            currency: "INR",
            amount: "20.00",
            buyer_name: "John Doe",
            buyer_phone: "+919900000000",
            buyer_email: "john@doe.com",
            shipping_address: null,
            shipping_city: null,
            shipping_state: null,
            shipping_zip: null,
            shipping_country: null,
            quantity: 1,
            unit_price: "20.00",
            fees: "0.38",
            variants: [],
            custom_fields: {},
            affiliate_commission: "0",
            payment_request: `https://test.instamojo.com/api/1.1/payment-requests/${paymentRequestId}/`,
            instrument_type: "NETBANKING",
            billing_instrument: "Domestic Netbanking Regular",
            tax_invoice_id: "",
            failure: null,
            payout: null,
            created_at: "2020-08-16T08:34:29.939734Z",
          },
        ],
        allow_repeated_payments: false,
        customer_id: null,
        created_at: "2020-08-16T08:26:26.382335Z",
        modified_at: "2020-08-16T08:34:40.470238Z",
      },
    };
    maxios.get.mockImplementationOnce(() =>
      Promise.resolve({ data: statusResponseObject })
    );
    maxios.get.mockImplementationOnce(() =>
      Promise.reject(promiseRejectResponse)
    );

    const response = await Instamojo.getPaymentRequestStatus(paymentRequestId);
    const rejectedResponse = await Instamojo.getPaymentRequestStatus(
      paymentRequestId
    );

    expect(response).toStrictEqual(statusResponseObject);
    expect(rejectedResponse).toStrictEqual(promiseRejectResponse.response);
    expect(maxios.get).toHaveBeenCalledTimes(2);
    expect(maxios.get).toHaveBeenCalledWith(
      `/payment-requests/${paymentRequestId}`
    );
  });

  test("Should get One payed Payment details", async () => {
    const onePayedExpectedResponse = {
      success: true,
      payment_request: {
        id: paymentRequestId,
        phone: null,
        email: "",
        buyer_name: "",
        amount: "20.00",
        purpose: "Product name",
        expires_at: null,
        status: "Completed",
        send_sms: false,
        send_email: false,
        sms_status: null,
        email_status: null,
        shorturl: null,
        longurl: `https://test.instamojo.com/@USER/${paymentRequestId}`,
        redirect_url: "",
        webhook: "",
        payment: {
          payment_id: paymentId,
          status: "Credit",
          currency: "INR",
          amount: "20.00",
          buyer_name: "John Doe",
          buyer_phone: buyerPhone,
          buyer_email: "john@doe.com",
          shipping_address: null,
          shipping_city: null,
          shipping_state: null,
          shipping_zip: null,
          shipping_country: null,
          quantity: 1,
          unit_price: "20.00",
          fees: "0.38",
          variants: [],
          custom_fields: {},
          affiliate_commission: "0",
          payment_request: `https://test.instamojo.com/api/1.1/payment-requests/${paymentRequestId}/`,
          instrument_type: "NETBANKING",
          billing_instrument: "Domestic Netbanking Regular",
          tax_invoice_id: "",
          failure: null,
          payout: null,
          created_at: "2020-08-16T08:34:29.939734Z",
        },
        allow_repeated_payments: false,
        customer_id: null,
        created_at: "2020-08-16T08:26:26.382335Z",
        modified_at: "2020-08-16T08:34:40.470238Z",
      },
    };
    maxios.get.mockImplementationOnce(() => {
      return Promise.resolve({ data: onePayedExpectedResponse });
    });

    maxios.get.mockImplementationOnce(() =>
      Promise.reject(promiseRejectResponse)
    );

    const response = await Instamojo.getOnePayedPaymentDetails(
      paymentRequestId,
      paymentId
    );
    const rejectedResponse = await Instamojo.getOnePayedPaymentDetails(
      paymentRequestId
    );

    expect(response).toStrictEqual(onePayedExpectedResponse);
    expect(rejectedResponse).toStrictEqual(promiseRejectResponse.response);
    expect(maxios.get).toHaveBeenCalledTimes(2);
    expect(maxios.get).toHaveBeenCalledWith(
      `/payment-requests/${paymentRequestId}/${paymentId}`
    );
  });
});
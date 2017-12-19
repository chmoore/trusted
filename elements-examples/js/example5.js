(function() {
  "use strict";
  
  var stripe = Stripe('pk_test_x7uftfLyZZnNwe9ci6k1hylo');

  var elements = stripe.elements();

  /**
   * Card Element
   */
  var card = elements.create("card", {
    iconStyle: "solid",
    style: {
      base: {
        iconColor: "#999",
        color: "#000",
        fontWeight: 400,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        fontSize: "15px",
        fontSmoothing: "antialiased",

        "::placeholder": {
          color: "#ccc"
        },
        ":-webkit-autofill": {
          color: "#999"
        }
      },
      invalid: {
        iconColor: "#eb1c26",
        color: "#eb1c26"
      }
    }
  });
  card.mount("#example5-card");

  /**
   * Payment Request Element
   */
  var paymentRequest = stripe.paymentRequest({
    country: "US",
    currency: "usd",
    total: {
      amount: 2500,
      label: "Total"
    },
    requestShipping: true,
    shippingOptions: [
      {
        id: "free-shipping",
        label: "Free shipping",
        detail: "Arrives in 5 to 7 days",
        amount: 0
      }
    ]
  });
  paymentRequest.on("token", function(result) {
    var example = document.querySelector(".example5");
    example.querySelector(".token").innerText = result.token.id;
    example.classList.add("submitted");
    result.complete("success");
  });

  var paymentRequestElement = elements.create("paymentRequestButton", {
    paymentRequest: paymentRequest,
    style: {
      paymentRequestButton: {
        theme: "light"
      }
    }
  });

  paymentRequest.canMakePayment().then(function(result) {
    if (result) {
      document.querySelector(".example5 .card-only").style.display = "none";
      document.querySelector(
        ".example5 .payment-request-available"
      ).style.display =
        "block";
      paymentRequestElement.mount("#example5-paymentRequest");
    }
  });

  registerElements([card], "example5");
})();

import axios from 'axios';
const stripe=Stripe('pk_test_51RQVz8QcUoE3EoqWIhZCFZ3jGq6w7Kn5oNhIs3TsdUeLBdtwbbEGqiISKnHt9IClWm4IRA6UgG5V4KxMPYky8Kpx00RBwyavW8');


export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

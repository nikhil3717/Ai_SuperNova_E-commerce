const paymentModel = require("../models/payment.model")
const axios = require("axios")


require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createPayment = async (req, res) => {
  const token = req.cookies?.token || req.headers?.Authorization?.split(" ")[1];

  try {
    const orderId = req.params.orderId;

    const orderResponse = await axios.get(`http://localhost:3003/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const totalPrice = orderResponse.data.order.totalPrice
    console.log(totalPrice)

    const order = await razorpay.orders.create(totalPrice);

    const newPayment = await paymentModel.create({
      order: orderId,
      razorpayOrderId: order.id,
      user: req.user.id,
      price: {
        amount: order.amount,
        currency: order.currency
      }

    })
    res.status(201).json({
      message: "payment initiated",
      success: true,
      data: newPayment
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message
    })
  }
}

const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET

  try {
    const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')

    const isValid = validatePaymentVerification({
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
    }, signature, secret)

    if (!isValid) {
      return res.status(400).json({
        message: "invalid signature"
      })
    }

    const payment = await paymentModel.findOne({
      razorpayOrderId, status: "PENDING"
    })

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      })
    }

    payment.paymentId = razorpayPaymentId;
    payment.signature = signature;
    payment.status = "COMPLETED";

    await payment.save()

    res.status(200).json({
      message: "payment verify successfull",
      payment
    })

  } catch (error) {

  }



}

module.exports = { createPayment, verifyPayment }
import React, { useState, useEffect } from 'react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {

try {

const storedUser = JSON.parse(localStorage.getItem("user"));

const userId =
storedUser?._id ||
storedUser?.id ||
storedUser?.user?._id;

if(!userId){
console.log("User ID not found");
setLoading(false);
return;
}

const res = await fetch(`/api/payments/user/${userId}`);

const data = await res.json();

setPayments(data.payments || []);

const total = (data.payments || []).reduce(
(sum,p)=>sum + (p.amount || 0),0
);

setTotalSpent(total);

} catch (err) {

console.error("Error fetching payments:", err);

}

setLoading(false);

};

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div className="payments-container">
      <h1>Payment History</h1>
      <div className="payment-summary">
        <div className="summary-card">
          <h3>Total Spent</h3>
          <p className="amount">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Transactions</h3>
          <p className="amount">{payments.length}</p>
        </div>
      </div>

      {payments.length > 0 ? (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Type</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{new Date(payment.createdAt).toLocaleString()}</td>
                <td>${payment.amount?.toFixed(2) || '0.00'}</td>
                <td><span className={`status-${payment.status?.toLowerCase()}`}>{payment.status}</span></td>
                <td>{payment.paymentMethod}</td>
                <td>{payment.transactionId || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No payment history yet.</p>
      )}
    </div>
  );
};

export default Payments;

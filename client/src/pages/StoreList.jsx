import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import RatingStamp from '../components/RatingStamp';
import '../styles/Stores.css';

export default function StoreList() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [nameQuery, setNameQuery] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStoreId, setSavingStoreId] = useState(null);

  const loadStores = useCallback(
    async (name, address, currentSortBy, currentSortOrder) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ sortBy: currentSortBy, sortOrder: currentSortOrder });
      if (name) params.set('name', name);
      if (address) params.set('address', address);

      try {
        const data = await api.get(`/stores?${params.toString()}`, token);
        setStores(data.stores);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Debounce search/sort so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadStores(nameQuery, addressQuery, sortBy, sortOrder);
    }, 400);
    return () => clearTimeout(timeout);
  }, [nameQuery, addressQuery, sortBy, sortOrder, loadStores]);

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  async function handleRate(storeId, rating) {
    setSavingStoreId(storeId);
    try {
      await api.post(`/stores/${storeId}/ratings`, { rating }, token);
      setStores((prev) =>
        prev.map((store) => (store.id === storeId ? { ...store, my_rating: rating } : store))
      );
      // Refresh to get the recalculated average
      loadStores(nameQuery, addressQuery, sortBy, sortOrder);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStoreId(null);
    }
  }

  return (
    <div className="page">
      <h1>Store ledger</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by store name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by address"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
          <option value="name">Sort: Name</option>
          <option value="rating">Sort: Rating</option>
        </select>
        <button type="button" className="sort-direction-btn" onClick={toggleSortOrder}>
          {sortOrder === 'asc' ? 'Ascending \u2191' : 'Descending \u2193'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="page-status">Reading the ledger...</p>}
      {!loading && stores.length === 0 && (
        <p className="page-status">No stores match that search yet — try a different name or address.</p>
      )}

      <div className="store-grid">
        {stores.map((store) => (
          <div className="store-card" key={store.id}>
            <div className="store-card-head">
              <div>
                <h2>{store.name}</h2>
                <p className="store-address">{store.address}</p>
              </div>
              <RatingStamp value={store.average_rating} count={store.rating_count} />
            </div>

            <div className="my-rating">
              <span className="my-rating-label">
                Your entry: {store.my_rating ? `${store.my_rating} of 5` : 'not yet rated'}
              </span>
              <StarRating
                value={store.my_rating}
                disabled={savingStoreId === store.id}
                onChange={(value) => handleRate(store.id, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { dataAPI } from '../services/api';
import MapComponent from './MapComponent';

const Home = ({ selectedCabang, selectedUnit }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    dataAPI.getBranchLocations({
      cabang: selectedCabang,
      unit: selectedUnit
    })
    .then((res) => setLocations(res.data))
    .catch((err) => console.error("Error fetching locations", err));
  }, [selectedCabang, selectedUnit]);

  return (
    <div className="p-4">
      {/* ...komponen lainnya */}
      <MapComponent locations={locations} />
    </div>
  );
};

export default Home;

import { useEffect, useState } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';

const Home = ({ selectedCabang, selectedUnit }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/api/branch-locations", {
      params: {
        cabang: selectedCabang,
        unit: selectedUnit
      }
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

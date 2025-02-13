import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";

function ImportExcel() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(response.data.message);
    } catch (error) {
      console.error(error);
      alert('An error occurred during upload.');
    }
  };

  return (
  <div className="input-group">
    <input type="file" className='form-control' accept=".xlsx" onChange={handleFileChange} />
    <button className="btn btn-outline-primary" type="button" onClick={handleUpload}>Upload</button>
  </div>
  );
}

export default ImportExcel;
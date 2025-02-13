import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import DataTable from "react-data-table-component";
import JsBarcode from "jsbarcode";
import logo from '../images/karensilverdesign2.png';

const ExcelToTable = () => {
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;

    // 🟢 ใช้ useRef เพื่อเก็บค่าของ selectedRows ล่าสุด
    const selectedRowsRef = useRef([]);

    useEffect(() => {
        selectedRowsRef.current = selectedRows; // อัปเดตค่าใน ref ทุกครั้งที่ selectedRows เปลี่ยน
    }, [selectedRows]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
    
        reader.onload = (event) => {
            const binaryStr = event.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });
    
            // Clear previous data
            setColumns([]);
            setData([]);
            document.getElementById("btnSheet").innerHTML = "";

            // Loop through each sheet
            workbook.SheetNames.forEach((sheetName, index) => {
                const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
                // Create columns from keys of the object
                const generatedColumns = Object.keys(sheetData[0]).map((key) => ({
                    name: key,
                    selector: (row) => row[key],
                    sortable: true,
                }));
    
                // Create button for each sheet
                const button = document.createElement("button");
                button.className = "btn btn-outline-success";
                button.innerText = sheetName;
                button.onclick = () => {
                    setColumns(generatedColumns);
                    setData(sheetData);

                    document.getElementById("btnGenerate").innerHTML = "";
                    const generateButton = document.createElement("button");
                    generateButton.className = "btn btn-primary";
                    generateButton.innerText = "Generate";
                    generateButton.onclick = generateLabel;
                    document.getElementById("btnGenerate").appendChild(generateButton);
                };
                document.getElementById("btnSheet").appendChild(button);
            });
        };
        
        reader.readAsBinaryString(file);
    };

    // 🟢 ปรับให้ใช้ selectedRowsRef.current แทน selectedRows
  var generateLabel = () => {
    const selected = selectedRowsRef.current;
    if (selected.length === 0) {
        alert("Please select at least one row!");
        return;
    }

    // เปิดหน้าต่างใหม่
    const width = 800; // ความกว้างของหน้าต่างใหม่
    const height = 900; // ความสูงของหน้าต่างใหม่
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const newWindow = window.open("", "", `width=${width},height=${height},top=${top},left=${left}`);

    // แปลงข้อมูลเป็น HTML สำหรับแสดงในหน้าต่างใหม่
    if (newWindow) {
        newWindow.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Label</title><style>td {padding-left: 20px;}</style></head><body style="font-family: Arial, sans-serif; padding: 0; margin: 0;">`);
        selected.forEach((row, index) => {
            newWindow.document.write(`
                <div style="width: 7cm; height:7cm; position: relative; border: 1px solid black;">
                    <div style="position:relative; width: 100%; height: 1.25cm">
                        <img src="${logo}" width="110px"style="display: inline-block; position:absolute; padding: 5px;">
                        <div style="display: inline-block; right:0px; font-size: 10px; padding: 5px 10px; position:absolute;">
                            <span>Batch# <br> ${row['Batch No']}</span>
                            <br><svg id="BatchNo-${row['Batch No']+'-'+index}"></svg>
                        </div>
                    </div>
                    <div style="position:relative; width: 100%; height: 1.25cm; font-size: 8px;">
                        <span style="position:absolute; padding: 10px;">PO# <br> <span style="font-size: 15px;">${row['Order']}</span></span>
                    </div>
                    <div style="position:relative; width: 100%; height: 1.5cm; font-size: 10px; outline: 1px solid black;">
                        <div style="padding: 5px 10px;">
                            <span>SK J# <br> ${row['SKU']}</span><br>
                            <svg id="SKU-${(row['SKU']+'-'+index.toString()).replace(/\./g, "-")}"></svg>
                        </div>
                    </div>
                    <div style="position:relative; width: 100%; height: 1.5cm; font-size: 10px;">
                        <div style="position:absolute; width: 50%; border-right: 1px solid black; height: 100%">
                            <div style="padding: 5px 10px;">
                                <span>Order Qty<br> ${row['Order Qty']}</span><br>
                                <svg id="OrderQty-${(row['Order Qty']+'-'+index.toString()).replace(/\./g, "-")}"></svg>
                            </div>
                        </div>
                        <div style="position:absolute; width: 50%; right:0; height: 100%">
                            <div style="padding: 5px 10px;">
                                <span>Size <br> ${row['Size'] != null ? row['Size'] : ''}</span><br>
                                ${(row['Size'] != null ? `<svg id="Size-${(row['Size']+'-'+index.toString()).replace(/\./g, "-")}"></svg>` : '')}
                            </div>
                        </div>
                    </div>
                    <div style="position:relative; width: 100%; height: 1.5cm; font-size: 10px; outline: 1px solid black;">
                        <div style="padding: 5px 10px;">
                            <span>Product Code <br> ${row['Product Code']}</span><br>
                            <svg id="ProductCode-${(row['Product Code']+'-'+index.toString()).replace(/\./g, "-")}"></svg>
                        </div>
                    </div>
                </div>
            `);
        });
        newWindow.document.write('</body></html>');
        // รอให้หน้าต่างใหม่โหลดเสร็จก่อนสร้าง Barcode
        newWindow.onload = () => {
            selected.forEach((row, index) => {
                let list = ['Batch No', 'SKU', 'Order Qty', 'Size', 'Product Code'];
                list.forEach((item) => {
                    if (row[item] != null) {
                        const elem = newWindow.document.querySelector(`#${item.replace(/\s+/g, '')}-${((row[item]+"-"+index).toString()).replace(/\./g, "-")}`);
                        if (elem) {
                            // ใช้ JsBarcode เพื่อสร้าง Barcode ใน SVG
                            JsBarcode(elem, row[item] || "N/A", {
                                format: "CODE128",
                                width: 0.7,
                                height: 20,
                                displayValue: false,
                                margin: 0
                            });
                        } 
                    }
                });
            });
        };
        newWindow.document.close();
    }
};

  return (
    <div>
        <div className="input-group">
            <input type="file" className='form-control' accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
        <div className="row mt-4 mb-3">
            <div className="col btn-group" id="btnSheet"></div>
        </div>
        <div className="row mt-4 mb-3">
            <div className="col-md-6">
                <h3>Dashboard</h3>
            </div>
            <div className="col-md-6 text-end" id="btnGenerate">
                {/* <button className="btn btn-primary" onClick={generateLabel}>Generate</button> */}
            </div>
        </div>
        <div className="card mb-4">
            <div className="card-body">
                <div style={{ marginTop: "20px" }}>
                    <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    paginationPerPage={rowsPerPage}
                    selectableRows
                    highlightOnHover
                    onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                    onChangePage={(page) => setCurrentPage(page - 1)}
                    responsive
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExcelToTable;

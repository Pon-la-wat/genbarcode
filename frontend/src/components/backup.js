import React, { useState } from "react";
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

const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
            const binaryStr = event.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });

            // Loop through each sheet
            workbook.SheetNames.forEach((sheetName) => {
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                    // Create columns from keys of the object
                    const generatedColumns = Object.keys(sheetData[0]).map((key) => ({
                            name: key,
                            selector: (row) => row[key],
                            sortable: true,
                    }));

                    setColumns((prevColumns) => [...prevColumns, ...generatedColumns]);
                    setData((prevData) => [...prevData, ...sheetData]);
            });
    };

    reader.readAsBinaryString(file);
};

  const generateLabel = () => {
    if (selectedRows.length === 0) {
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
        newWindow.document.write(`<table style="border-collapse: collapse; font-size: 14px; width: 5cm; border: 1px solid black;">`);
        selectedRows.forEach((row, index) => {
            newWindow.document.write(`
                <tr>
                    <td colspan="2" style="padding-top: 10px;">
                        <img src="${logo}" width="180px">
                    </td>
                    <td colspan="2" style="padding-top: 10px; padding-right: 20px; float: right;">
                        <p style="padding-left: 10px; margin: 10px 10px 0 0;">Batch# ${row['Batch No']}</p>
                        <div class="barcode"><svg style="height: 60px;" id="BatchNo-${row['Batch No']+'-'+index}"></svg></div>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid black;">
                    <td colspan="4">
                        <p style="margin-bottom: 0px;">PO#</p>
                        <p style="font-size: 20px; margin: 10px 0;">${row['Order']}</p>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid black;">
                    <td colspan="4" style="padding: 0 10px;">
                        <p style="padding-left: 10px; margin-bottom: 0">SKU# <br> ${row['SKU']}</p>
                        <div class="barcode"><svg style="height: 60px;" id="SKU-${(row['SKU']+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid black; width: 100%">
                    <td colspan="2" style="border-right: 1px solid black; padding: 0 10px; width: 50%;">
                        <p style="padding-left: 10px; margin-bottom: 0">Order Qty# <br> ${row['Order Qty']}</p>
                        <div class="barcode"><svg style="height: 60px;" id="OrderQty-${(row['Order Qty']+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                    </td>
                    <td colspan="2" style="padding: 0 10px; width: 50%;">
                        <p style="padding-left: 10px; margin-bottom: 0">Size# <br> ${row['Size'] != null ? row['Size'] : ''}</p>
                        <div class="barcode"><svg style="height: 60px;" id="Size-${(row['Size']+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                    </td>
                </tr>
                <tr>
                    <td colspan="4" style="padding: 0 10px;">
                        <p style="padding-left: 10px; margin-bottom: 0">Product Code# <br> ${row['Product Code']}</p>
                        <div class="barcode"><svg style="height: 60px;" id="ProductCode-${(row['Product Code']+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                    </td>
                </tr>
            `);
        });
        newWindow.document.write('</table></body></html>');
        // รอให้หน้าต่างใหม่โหลดเสร็จก่อนสร้าง Barcode
        newWindow.onload = () => {
            selectedRows.forEach((row, index) => {
                let list = ['Batch No', 'SKU', 'Order Qty', 'Size', 'Product Code'];
                list.forEach((item) => {
                    if (row[item] != null) {
                        const elem = newWindow.document.querySelector(`#${item.replace(/\s+/g, '')}-${((row[item]+"-"+index).toString()).replace(/\./g, "-")}`);
                        if (elem) {
                            // ใช้ JsBarcode เพื่อสร้าง Barcode ใน SVG
                            JsBarcode(elem, row[item] || "N/A", {
                                format: "CODE128",
                                width: 1.2,
                                height: 42,
                                displayValue: false
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
            <div className="col-md-6">
                <h3>Dashboard</h3>
            </div>
            <div className="col-md-6 text-end">
                <button className="btn btn-primary" onClick={generateLabel}>Generate</button>
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

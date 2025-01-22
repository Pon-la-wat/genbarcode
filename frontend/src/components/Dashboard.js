import React, { useState, useEffect } from "react";
import DataTable from 'react-data-table-component';
import JsBarcode from "jsbarcode";
import logo from '../images/karensilverdesign2.png';

function Dashboard() {
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:5001"); // เชื่อมต่อกับ WebSocket Server
        ws.onmessage = (event) => {
            const updatedData = JSON.parse(event.data); // รับข้อมูลล่าสุดจาก WebSocket
            setData(updatedData);
        };
        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };
        return () => ws.close(); // ปิด WebSocket เมื่อ Component ถูกทำลาย
    }, []);

    const columns = [
        { name: '#', selector: (row, index) => index + 1 + currentPage * rowsPerPage, sortable: false },
        { name: 'Order Number', selector: row => row.order_number, sortable: true },
        { name: 'Product Code', selector: row => row.product_code, sortable: true },
        { name: 'Batch No', selector: row => row.batch_no, sortable: true },
        { name: 'Order Qty', selector: row => row.order_qty, sortable: true },
        { name: 'Size', selector: row => row.size, sortable: true },
        { name: 'SKU', selector: row => row.sku, sortable: true },
        { name: 'Print Qty', selector: row => row.print_qty, sortable: true },
    ];

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
            newWindow.document.write(`<table style="border-collapse: collapse; font-size: 16px;">`);
            selectedRows.forEach((row, index) => {
                newWindow.document.write(`
                    <tr>
                        <td colspan="2" style="padding-top: 20px;">
                            <img src="${logo}" width="180px">
                        </td>
                        <td colspan="2" style="padding-top: 20px; padding-right: 20px; float: right;">
                            <p style="padding-left: 10px; margin: 10px 10px 0 0;">Batch# ${row.batch_no}</p>
                            <div class="barcode"><svg style="height: 60px;" id="batch_no-${row.batch_no+'-'+index}"></svg></div>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid black;">
                        <td colspan="4">
                            <p>PO#</p>
                            <p style="font-size: 30px; margin: 10px 0;">${row.order_number}</p>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid black;">
                        <td colspan="4" style="padding: 0 10px;">
                            <p style="padding-left: 10px; margin-bottom: 0">SKU# <br> ${row.sku}</p>
                            <div class="barcode"><svg style="height: 60px;" id="sku-${(row.sku+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid black; width: 100%">
                        <td colspan="2" style="border-right: 1px solid black; padding: 0 10px; min-width: 50%;">
                            <p style="padding-left: 10px; margin-bottom: 0">Order Qty# <br> ${row.order_qty}</p>
                            <div class="barcode"><svg style="height: 60px;" id="order_qty-${(row.order_qty+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                        </td>
                        <td colspan="2" style="padding: 0 10px; width: 50%;">
                            <p style="padding-left: 10px; margin-bottom: 0">Size# <br> ${row.size != null ? row.size : ''}</p>
                            <div class="barcode"><svg style="height: 60px;" id="size-${(row.size+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="padding: 0 10px;">
                            <p style="padding-left: 10px; margin-bottom: 0">Product Code# <br> ${row.product_code}</p>
                            <div class="barcode"><svg style="height: 60px;" id="product_code-${(row.product_code+'-'+index.toString()).replace(/\./g, "-")}"></svg></div>
                        </td>
                    </tr>
                `);
            });
            newWindow.document.write('</table></body></html>');
            // รอให้หน้าต่างใหม่โหลดเสร็จก่อนสร้าง Barcode
            newWindow.onload = () => {
                selectedRows.forEach((row, index) => {
                    let list = ['batch_no', 'sku', 'order_qty', 'size', 'product_code'];
                    list.forEach((item) => {
                        console.log(row[item]);
                        
                        if (row[item] != null) {
                            const elem = newWindow.document.querySelector(`#${item}-${((row[item]+"-"+index).toString()).replace(/\./g, "-")}`);
                            if (elem) {
                                // ใช้ JsBarcode เพื่อสร้าง Barcode ใน SVG
                                JsBarcode(elem, row[item] || "N/A", {
                                    format: "CODE128",
                                    width: 1.5,
                                    height: 40,
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
                    <DataTable
                        title="Order List"
                        columns={columns}
                        data={data}
                        pagination
                        paginationPerPage={rowsPerPage}
                        selectableRows
                        onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                        onChangePage={(page) => setCurrentPage(page - 1)}
                        highlightOnHover
                    />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
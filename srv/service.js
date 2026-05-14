const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function() {
    // Connect to the external Northwind service configured in package.json
    const northwind = await cds.connect.to('northwind'); 
    
    // Intercept the READ operation on your local entity projection
    this.on('READ', 'Customers1', async (req) => {
        // Forward the query directly to the external OData API
        return northwind.run(req.query);
    });

    const API_SALES_ORDER_SRV = await cds.connect.to ('API_SALES_ORDER_SRV');
    const { A_SalesOrder } = API_SALES_ORDER_SRV.entities; 
    this.on('READ', 'A_SalesOrder1', async (req) => {
        try {
    const  orders = await API_SALES_ORDER_SRV.send({
        query: SELECT.from(A_SalesOrder).columns('SalesOrder', 
                        'SoldToParty', 
                        'TotalNetAmount', 
                        'SalesOrderDate', 
                        'OverallDeliveryStatus').limit(10),
        headers:{
            apikey: "hzBkLo031A4MyIc4L78FjDeHEpHlAXll",
            Accept: "application/json",
        },
    });
    orders.$count = orders.length; // Add the count of records to the response
    return orders;  
}
catch (error) {   
        req.error(500, `External API Error: ${error.message}`);
    }
    });
});
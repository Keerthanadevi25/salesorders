const cds = require('@sap/cds');
const { SELECT, orders } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function() {
    // Connect to the external Northwind service configured in package.json
    const northwind = await cds.connect.to('northwind'); 
    const { Customers } = northwind.entities; // Access the Customers entity from the Northwind service
    const { Mappingcustomers } = this.entities; // Access the local mapping table entity
    // Intercept the READ operation on your local entity projection
    this.on('READ', 'Customers1', async (req) => {
        // Forward the query directly to the external OData API
        return northwind.run(req.query);
    });
    //Reading customers from mapping table and orders from s4HANA cloud system
    this.on("READ", 'Customers2', async(req)=>{
        const Customer = await northwind.send({
            query:SELECT.from(Customers)    });

        // Get the S4 CustomerId from the mapping table
        for(const cust of Customer.value)
            {
            const mapping = await SELECT.one.from(Mappingcustomers).where({ nwCustomerid : cust.CustomerID});
            if(mapping){
                cust.s4CustomerId = mapping.s4CustomerId; // Replace the CustomerID with the S4 CustomerId
                }
             }
    
        Customer.$count = Customer.length; // Add the count of records to the response
        return Customer;
    })

    //Reading orders from s4HANA cloud system
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
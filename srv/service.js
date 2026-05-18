const cds = require('@sap/cds');
const { SELECT, orders } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function() {
    // Connect to the external Northwind service configured in package.json
    const northwind = await cds.connect.to('northwind'); 
    const { Customers } = northwind.entities; // Access the Customers entity from the Northwind service
    const { Mappingcustomers } = this.entities; // Access the local mapping table entity
    const API_SALES_ORDER_SRV = await cds.connect.to ('API_SALES_ORDER_SRV');
    const { A_SalesOrder } = API_SALES_ORDER_SRV.entities; 
     const mappings = await SELECT.from(Mappingcustomers);
    // Intercept the READ operation on your local entity projection
    this.on('READ', 'Customers1', async (req) => {
        // Forward the query directly to the external OData API
        return northwind.run(req.query);
    });
    //Reading customers from mapping table 
    // this.on("READ", 'Customers2', async(req)=>{
    //     const Customer = await northwind.send({
    //         query:SELECT.from(Customers)    });

    //     // Get the S4 CustomerId from the mapping table
    //     for(const cust of Customer.value)
    //         {
    //         const mapping = await SELECT.one.from(Mappingcustomers).where({ nwCustomerid : cust.CustomerID});
    //         if(mapping){
    //             cust.s4CustomerId = mapping.s4CustomerId; // Replace the CustomerID with the S4 CustomerId
    //             }
    //          }
    
    //     Customer.$count = Customer.length; // Add the count of records to the response
    //     return Customer;
    // });

    //Reading orders from s4HANA system    
    this.on("READ", 'Customers2', async (req) => {
        try {
            // 1. Initialize a clean query targetted at the remote Customers collection
            const remoteQuery = SELECT.from(Customers);
            
            // 2. Safely capture, map, and pass down filters
            if (req.query.SELECT.where) {
                // Stringify the filter block to easily replace the parameter key
                let rawWhereStr = JSON.stringify(req.query.SELECT.where);
                
                // Replace lowercase local projection key with the real remote model key
                rawWhereStr = rawWhereStr.replace(/"customerId"/g, '"CustomerID"');
                
                // Assign the corrected structure back to your outbound command
                remoteQuery.SELECT.where = JSON.parse(rawWhereStr);
            }

            // 3. Execute the request against Northwind
            const customer = await northwind.send({ query: remoteQuery });                
                const mapping = mappings.find(
                (mapping) => mapping.nwCustomerId === customer.customerId   );   
                customer. s4CustomerId = mapping?.s4CustomerId;

                if (customer.s4CustomerId) {
                    const s4Orders = await API_SALES_ORDER_SRV.send({
                        query: SELECT.from(A_SalesOrder)
                            .where({ SoldToParty: customer.s4CustomerId })
                            .limit(10),
                        headers: { Accept: "application/json" }
                    });
                    
                    customer.orders = s4Orders;
                    customer.orders.$count = s4Orders.length;
                } else {
                    customer.orders = [];
                    customer.orders.$count = 0;
                }
           // }

            return customer;

        } catch (error) {
            return req.error(502, `Failed to fetch or stitch remote records: ${error.message}`);
        }
    });




    // this.on("READ", 'Customers2', async(req)=>{
    //     const customer = await northwind.send({
    //         query:SELECT.one.from(Customers).where({CustomerID: req.data?.customerId}), 
    //      });
    //      customer = await getS4CustomerId(customer);
    //      customer = await getS4Orders(customer);
    //   return customer;
    //     });

    // const getS4CustomerId = async (customer) => {
    //   const mapping = await SELECT.one.from(Mappingcustomers).where({nwCustomerid: customer.customerId});      
    //   customer.s4CustomerId = mapping?.s4CustomerId;
    //   return customer;
    // };

    // const getS4Orders = async (customer) => {
    //  const  orders = await API_SALES_ORDER_SRV.send({
    //     query: SELECT.from(A_SalesOrder).columns('SalesOrder', 
    //                     'SoldToParty', 
    //                     'TotalNetAmount', 
    //                     'SalesOrderDate', 
    //                     'OverallDeliveryStatus').limit(10),
    //     headers:{
    //         Accept: "application/json",
    //     },
    // });
    //   customer.orders = orders;
    //   customer.orders.$count = orders.length;
    //   return customer;
    // };        

    //Reading orders from s4HANA cloud system    
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
namespace Salesorders;
using { API_SALES_ORDER_SRV as sales } from '../srv/external/API_SALES_ORDER_SRV';
using { northwind as cust } from '../srv/external/northwind';
entity Mappingcustomers
{
    key ID : UUID;
    s4CustomerId : String(100);
    nwCustomerid : String(100);
    nwCustomerName : String(100);
};
entity A_SalesOrder1 as
        projection on sales.A_SalesOrder
        {
            SalesOrder as salesOrder,
            SoldToParty as customerId,
            SalesOrderDate as salesOrderDate,
            TotalNetAmount as totalAmount,
            OverallDeliveryStatus as status
        };

entity Customers1 as
        projection on cust.Customers
        {
            CustomerID as customerId,
            CompanyName as companyName,
            ContactName as contactName,
            City as city,
            Country as country,
            Phone as phone
        };
        entity Customers2 {
            key customerId : String;
            customerName : String;
            contactName : String;
            address : String;
            city: String;
            country: String;
            phone: String;
            s4CustomerId : String;
            orders : Association to many A_SalesOrder1 on orders.customerId = s4CustomerId;
        };

    
        


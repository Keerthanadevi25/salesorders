using { Salesorders as my } from '../db/schema.cds';

using { API_SALES_ORDER_SRV.A_SalesOrder } from './external/API_SALES_ORDER_SRV';

using { northwind.Customers } from './external/northwind';

@path : '/service/SalesordersService'
service SalesordersService
{
    @odata.draft.enabled
    entity Mappingcustomers as
        projection on my.Mappingcustomers;

    entity A_SalesOrder1 as
        projection on A_SalesOrder
        {
            SalesOrder as salesOrder,
            SoldToParty as customerId,
            SalesOrderDate as salesOrderDate,
            TotalNetAmount as totalAmount,
            OverallDeliveryStatus as status
        };

    entity Customers1 as
        projection on Customers
        {
            CustomerID as customerId,
            CompanyName as companyName,
            ContactName as contactName,
            City as city,
            Country as country,
            Phone as phone
        };
}

annotate SalesordersService with @requires :
[
    'authenticated-user'
];

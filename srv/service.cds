using { Salesorders as my } from '../db/schema.cds';

@path : '/service/SalesordersService'
service SalesordersService
{
    @odata.draft.enabled
    entity Mappingcustomers as
        projection on my.Mappingcustomers;
}

annotate SalesordersService with @requires :
[
    'authenticated-user'
];

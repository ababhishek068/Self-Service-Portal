import { MultiStepRequestPage } from '@/components/shared/MultiStepRequestPage'
import { listModuleRequests } from '@/api/endpoints/requestEndpoint'
import { fuelRequestTypeOptions } from '@/data/essOptions'
import { fuelHeaderSchema } from '@/schemas/requestSchemas'
import { useLookupOptions } from '@/hooks/useLookupOptions'

const module = { module: 'fuelRequest', entity: 'selfServiceFuelRequests' } as const

export function FuelRequest() {
  const fuelCards = useLookupOptions('fuel-cards')
  const vehicles = useLookupOptions('vehicles')
  const vendors = useLookupOptions('vendors')

  return (
    <MultiStepRequestPage
      title="Fuel Requisition"
      headerLabel="New Fuel Requisition Card"
      description="Request fuel against a vehicle or a fuel recharge card, then submit for approval."
      module={module}
      queryKey={['facility', 'fuel-request']}
      listRequests={() => listModuleRequests(module)}
      newButtonLabel="New Fuel Requisition"
      headerSchema={fuelHeaderSchema}
      headerDefaults={{
        requestType: '0',
        cardNo: '',
        vehicleNo: '',
        fuelDealer: '',
        quantity: 0,
        price: 0,
        purpose: '',
      }}
      buildHeaderPayload={(values) => ({
        ...values,
        title: String(values.purpose || 'Fuel Requisition'),
      })}
      headerFields={[
        { name: 'requestType', label: 'Request Type', type: 'select', options: fuelRequestTypeOptions, valuePaths: ['RequestType', 'Request_Type'], valueMap: { 'vehicle fuel': '0', vehicle: '0', 'fuel recharge card': '3', card: '3' } },
        { name: 'cardNo', label: 'Fuel Card No.', type: 'select', options: fuelCards.options, valuePaths: ['CardNo', 'Card_No'] },
        { name: 'vehicleNo', label: 'Vehicle Registration No.', type: 'select', options: vehicles.options, valuePaths: ['VehicleNo', 'Vehicle_No'] },
        { name: 'fuelDealer', label: 'Fuel Dealer', type: 'select', options: vendors.options, valuePaths: ['FuelDealer', 'Fuel_Dealer'] },
        { name: 'quantity', label: 'Quantity of Fuel (Litres)', type: 'number', valuePaths: ['Quantity'] },
        { name: 'price', label: 'Fuel Price per Litre', type: 'number', valuePaths: ['Price'] },
        { name: 'purpose', label: 'Purpose', type: 'textarea', valuePaths: ['Purpose'] },
      ]}
      detailFields={[
        { label: 'Requisition No.', paths: ['request.requestNo'] },
        { label: 'Request Type', paths: ['payload.RequestType', 'payload.Request_Type'] },
        { label: 'Fuel Card No.', paths: ['payload.CardNo', 'payload.Card_No'] },
        { label: 'Vehicle No.', paths: ['payload.VehicleNo', 'payload.Vehicle_No'] },
        { label: 'Fuel Dealer', paths: ['payload.FuelDealer', 'payload.Fuel_Dealer'] },
        { label: 'Quantity (Litres)', paths: ['payload.Quantity'] },
        { label: 'Price per Litre', paths: ['payload.Price'], format: 'currency' },
        { label: 'Purpose', paths: ['payload.Purpose'] },
        { label: 'Status', paths: ['request.status'], format: 'status' },
      ]}
      businessRules={[
        'Vehicle fuel requires a vehicle registration number; a recharge card requires a card number.',
        'Capture the dealer, quantity and price per litre, then request approval.',
      ]}
    />
  )
}

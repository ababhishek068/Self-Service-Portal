import { createTrainingRequest, listTrainingRequests } from '@/api/endpoints/training'
import { RequestFormPage } from '@/components/shared/RequestFormPage'
import { trainingNeedsSchema, type TrainingNeedsForm } from '@/schemas/requestSchemas'

export function TrainingRequest() {
  return (
    <RequestFormPage
      title="Training Requisitions"
      description="Create training needs cards with period, provider, cost, and justification."
      schema={trainingNeedsSchema}
      queryKey={['hr', 'training-request']}
      listRequests={listTrainingRequests}
      createRequest={(values) => createTrainingRequest(values as TrainingNeedsForm)}
      moduleConfig={{ module: 'training', entity: 'selfServiceTrainingRequests' }}
      newButtonLabel="New Training Needs"
      defaultValues={{
        trainingTitle: '',
        trainingPeriod: '',
        provider: '',
        estimatedCost: 0,
        justification: '',
        groupName: '',
      }}
      fields={[
        { name: 'trainingTitle', label: 'Training title', type: 'text' },
        { name: 'trainingPeriod', label: 'Training period', type: 'text', placeholder: 'e.g. 5–10 Mar 2026' },
        { name: 'provider', label: 'Provider', type: 'text' },
        { name: 'estimatedCost', label: 'Estimated cost (optional)', type: 'number' },
        { name: 'groupName', label: 'Training group (optional)', type: 'text' },
        { name: 'justification', label: 'Justification', type: 'textarea' },
      ]}
      businessRules={[
        'Training period and provider are mandatory; estimated cost is optional.',
        'Submitted cards route to HR for approval.',
        'Training groups can be used for batch nominations.',
      ]}
    />
  )
}

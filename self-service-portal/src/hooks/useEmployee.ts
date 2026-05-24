import { useQuery } from '@tanstack/react-query'
import { getCurrentEmployee, listItemMaster } from '@/api/endpoints/employee'

export function useEmployee() {
  return useQuery({
    queryKey: ['employee', 'current'],
    queryFn: getCurrentEmployee,
  })
}

export function useItemMaster() {
  return useQuery({
    queryKey: ['item-master'],
    queryFn: listItemMaster,
  })
}

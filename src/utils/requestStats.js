export const calculateRequestStats = (requests) => {
  const total = requests.length;
  
  const pending = requests.filter(req => req.status === 'pending').length;
  const inProgress = requests.filter(req => 
    req.status === 'mg_approved' || 
    req.status === 'accounting_reviewed'
  ).length;
  const approved = requests.filter(req => req.status === 'director_approved').length;
  const rejected = requests.filter(req => req.status === 'rejected').length;
  
  return {
    total_requests: total,
    pending_requests: pending,
    in_progress_requests: inProgress,
    approved_requests: approved,
    rejected_requests: rejected
  };
};

export const getRequestStatusLabel = (status) => {
  const labels = {
    'pending': 'En attente',
    'mg_approved': 'Validée par MG',
    'accounting_reviewed': 'En étude par Comptabilité',
    'director_approved': 'Approuvée par Direction',
    'rejected': 'Refusée'
  };
  return labels[status] || status;
};








let pendingEvidence = null;

export const setPendingEvidence = (file) => {
  pendingEvidence = file;
};

export const getPendingEvidence = () => pendingEvidence;

export const clearPendingEvidence = () => {
  pendingEvidence = null;
};

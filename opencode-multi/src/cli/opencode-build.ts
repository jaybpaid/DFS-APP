import { modelManager } from '../sdk/models';

export const buildProject = () => {
  const recommendedModel = modelManager.getRecommendedModel();
  console.log(`Building project with model: ${recommendedModel}`);
  // Additional build logic
};

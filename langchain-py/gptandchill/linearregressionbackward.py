import numpy as np
from numpy import ndarray as NDArray

class Solution:
  

  def get_derivative(self, model_predictons: NDArray[np.float64], ground_truth: NDArray[np.float64], N:int, X: NDArray[np.float64], desired_weight: int) -> float: 
    # note that N is just len(X)
    return -2 * np.dot(ground_truth - model_predictions, X[:, desired_weight]) / N
  


  def get_model_prediction(self, X: NDArray[np.float64], weights: NDArray[np.float64]) -> NDArray[np.float64]:
    return np.squeeze(np.matmul(X, weights))
  

  learning_rate = 0.01

  def train_model(
      self,
      X: NDArray[np.float64],
      y: NDArray[np.float64],
      num_iterations: int,
      initial_weights: NDArray[np.float64],
  ) -> NDArray[np.float64]:
      
      # you will need call get_derivative() for each weight
      # and update each one seperately based on the learning rate
      # return np.round(your_answer,5)
  
        
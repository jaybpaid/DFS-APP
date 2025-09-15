import pytest
from src.fusion.ai_projection_fusion import ProjectionFusion

def test_projection_fusion_deterministic():
    fusion = ProjectionFusion()
    projections_a = {"player1": 20, "player2": 30}
    projections_b = {"player1": 25, "player2": 35}
    
    fused_output = fusion.fuse(projections_a, projections_b)
    
    assert fused_output["player1"] == 22.5  # Example expected value
    assert fused_output["player2"] == 32.5  # Example expected value

def test_projection_fusion_output_properties():
    fusion = ProjectionFusion()
    projections_a = {"player1": 20, "player2": 30}
    projections_b = {"player1": 25, "player2": 35}
    
    fused_output = fusion.fuse(projections_a, projections_b)
    
    assert all(player in fused_output for player in projections_a.keys())
    assert all(player in fused_output for player in projections_b.keys())
    assert len(fused_output) == len(projections_a)  # Ensure no players are lost in fusion

def test_projection_fusion_empty_input():
    fusion = ProjectionFusion()
    
    fused_output = fusion.fuse({}, {})
    
    assert fused_output == {}  # Expect empty output for empty inputs

def test_projection_fusion_invalid_input():
    fusion = ProjectionFusion()
    
    with pytest.raises(ValueError):
        fusion.fuse({"player1": 20}, {"player1": "invalid"})  # Expect error on invalid projection value
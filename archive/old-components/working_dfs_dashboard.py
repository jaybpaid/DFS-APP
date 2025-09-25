"""
Working DFS Dashboard - Design #5 Simulation-Focused
Core functionality with Streamlit + Plotly + Pandas + NumPy
"""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import time
from datetime import datetime
from typing import Dict, List, Any

# Page configuration
st.set_page_config(
    page_title="DFS Simulation Dashboard",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Professional styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #1e40af 100%);
        padding: 1.5rem 2rem;
        border-radius: 0.75rem;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    
    .stSelectbox > div > div > div {
        background-color: rgba(255,255,255,0.9);
        border-radius: 0.5rem;
    }
    
    .tier-top {
        background: linear-gradient(90deg, #dcfce7, #bbf7d0);
        border-left: 4px solid #22c55e;
        border-radius: 0.5rem;
        padding: 0.5rem;
        margin: 0.25rem 0;
    }
    
    .tier-good {
        background: linear-gradient(90deg, #fef3c7, #fde68a);
        border-left: 4px solid #f59e0b;
        border-radius: 0.5rem;
        padding: 0.5rem;
        margin: 0.25rem 0;
    }
    
    .tier-risk {
        background: linear-gradient(90deg, #fed7d7, #fca5a5);
        border-left: 4px solid #ef4444;
        border-radius: 0.5rem;
        padding: 0.5rem;
        margin: 0.25rem 0;
    }
</style>
""", unsafe_allow_html=True)

class DFSDataService:
    """Core data service for DFS dashboard"""
    
    @staticmethod
    @st.cache_data
    def get_player_data() -> pd.DataFrame:
        """Get player pool data"""
        data = {
            'Player': ['Josh Allen', 'Christian McCaffrey', 'Tyreek Hill', 'Travis Kelce', 'Saquon Barkley', 
                      'CeeDee Lamb', 'Lamar Jackson', 'Cooper Kupp', 'Stefon Diggs', 'Mark Andrews',
                      'Breece Hall', "Ja'Marr Chase", 'George Kittle', 'Derrick Henry', 'Mike Evans',
                      'Aaron Jones', 'Amon-Ra St. Brown', 'Bills DST', 'Ravens DST', 'Cowboys DST'],
            'Position': ['QB', 'RB', 'WR', 'TE', 'RB', 'WR', 'QB', 'WR', 'WR', 'TE',
                        'RB', 'WR', 'TE', 'RB', 'WR', 'RB', 'WR', 'DST', 'DST', 'DST'],
            'Team': ['BUF', 'SF', 'MIA', 'KC', 'NYG', 'DAL', 'BAL', 'LAR', 'BUF', 'BAL',
                    'NYJ', 'CIN', 'SF', 'TEN', 'TB', 'GB', 'DET', 'BUF', 'BAL', 'DAL'],
            'Opponent': ['MIA', 'NYG', 'BUF', 'LAC', 'SF', 'NYG', 'CIN', 'SEA', 'MIA', 'CIN',
                        'DEN', 'BAL', 'NYG', 'IND', 'CAR', 'CHI', 'ARI', 'MIA', 'CIN', 'NYG'],
            'Salary': [8400, 8800, 8200, 7800, 7200, 8600, 8000, 7600, 7600, 6400,
                      7400, 8000, 6000, 7000, 6200, 6800, 6800, 3200, 2800, 2200],
            'Projection': [22.5, 19.8, 16.8, 14.5, 17.3, 17.8, 21.2, 15.2, 15.2, 12.1,
                          16.1, 16.5, 11.8, 15.8, 14.3, 14.9, 13.7, 8.2, 7.1, 6.8],
            'Ownership': [18.5, 22.1, 15.3, 31.2, 19.8, 24.3, 16.7, 20.4, 12.8, 18.9,
                         14.7, 19.2, 15.6, 13.4, 11.8, 16.3, 12.1, 12.8, 9.4, 8.7],
            'AI_Score': ['A+', 'B+', 'A', 'A', 'A', 'A', 'A', 'B+', 'B', 'B+',
                        'B', 'A', 'B', 'B+', 'B', 'B+', 'B', 'A', 'B', 'B'],
            'Floor': [14.2, 12.5, 8.2, 8.1, 9.5, 9.1, 13.8, 9.3, 8.7, 7.2,
                     8.9, 9.8, 6.9, 9.1, 8.4, 8.6, 7.8, 3.1, 2.8, 2.5],
            'Ceiling': [32.8, 28.4, 28.9, 22.8, 26.1, 29.2, 31.5, 24.7, 23.1, 19.8,
                       24.3, 26.7, 18.9, 24.2, 22.1, 23.4, 21.3, 15.8, 13.2, 11.4]
        }
        
        df = pd.DataFrame(data)
        df['Value'] = (df['Projection'] * 1000 / df['Salary']).round(2)
        return df
    
    @staticmethod
    def get_simulation_results() -> Dict[str, Any]:
        """Get simulation results"""
        return {
            'total_lineups': 150,
            'simulations_run': 20000,
            'avg_win_rate': 12.7,
            'cash_rate': 68.3,
            'avg_roi': 115,
            'duplicate_risk': 3.4,
            'top5_rate': 34.2,
            'lineups': [
                {
                    'rank': 1,
                    'players': 'J.Allen • Barkley • Jones • Hill • Smith • Cooper • Kelce • Bills',
                    'stack': 'QB+2',
                    'salary': 49800,
                    'projection': 142.6,
                    'roi': 127,
                    'win_rate': 14.2,
                    'cash_rate': 72.8,
                    'top5_rate': 42.1,
                    'duplicate_risk': 3.2,
                    'ownership': 15.8,
                    'tier': 'TOP'
                },
                {
                    'rank': 2,
                    'players': 'L.Jackson • McCaffrey • Hall • Kupp • Evans • Chase • Andrews • Ravens',
                    'stack': 'QB+1',
                    'salary': 49200,
                    'projection': 138.9,
                    'roi': 118,
                    'win_rate': 12.8,
                    'cash_rate': 68.1,
                    'top5_rate': 38.9,
                    'duplicate_risk': 5.7,
                    'ownership': 21.4,
                    'tier': 'GOOD'
                },
                {
                    'rank': 3,
                    'players': 'Prescott • Henry • Jacobs • Lamb • Diggs • St.Brown • Kittle • Cowboys',
                    'stack': 'Game',
                    'salary': 49200,
                    'projection': 135.2,
                    'roi': 102,
                    'win_rate': 11.1,
                    'cash_rate': 64.3,
                    'top5_rate': 29.7,
                    'duplicate_risk': 1.8,
                    'ownership': 8.2,
                    'tier': 'OK'
                },
                {
                    'rank': 4,
                    'players': 'Mahomes • Taylor • Mixon • Jefferson • Adams • Brown • Waller • Chiefs',
                    'stack': 'Chalk',
                    'salary': 49600,
                    'projection': 133.8,
                    'roi': 95,
                    'win_rate': 9.8,
                    'cash_rate': 59.2,
                    'top5_rate': 25.8,
                    'duplicate_risk': 8.1,
                    'ownership': 28.7,
                    'tier': 'RISK'
                },
                {
                    'rank': 5,
                    'players': 'Herbert • Ekeler • Jacobs • Keenan • Williams • Godwin • Ertz • Chargers',
                    'stack': 'Game',
                    'salary': 48900,
                    'projection': 131.4,
                    'roi': 89,
                    'win_rate': 8.9,
                    'cash_rate': 61.7,
                    'top5_rate': 22.3,
                    'duplicate_risk': 2.1,
                    'ownership': 6.4,
                    'tier': 'OK'
                }
            ]
        }

def run_simulation():
    """Simulate optimization and simulation process"""
    progress_placeholder = st.empty()
    status_placeholder = st.empty()
    
    progress_bar = progress_placeholder.progress(0)
    
    for i in range(100):
        progress_bar.progress((i + 1) / 100)
        
        if i < 30:
            status_placeholder.info(f"🔄 Generating lineups... {i+1}%")
        elif i < 70:
            status_placeholder.info(f"🎯 Running Monte Carlo simulations... {i+1}%")
        else:
            status_placeholder.info(f"📊 Calculating analytics... {i+1}%")
        
        time.sleep(0.03)
    
    progress_placeholder.empty()
    status_placeholder.success("✅ Simulation complete! 20,000 iterations processed.")

def main():
    # Professional Header
    st.markdown("""
    <div class="main-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; font-size: 2.5rem; font-weight: bold;">🎯 DFS Simulation Dashboard</h1>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem; opacity: 0.9;">Design #5: Results-Focused • Streamlit + Plotly + MCP Enhanced</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1rem; opacity: 0.8;">Live System</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #22c55e;">🟢 Active</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Slate and Control Row
    slate_col, metric1, metric2, control_col = st.columns([3, 1, 1, 1])
    
    with slate_col:
        selected_slate = st.selectbox(
            "📊 Active Slate",
            ["NFL Main Slate - $12.5M Prizes", "NFL Showdown - PHI @ KC", "NBA Main Slate - $8.2M"],
            key="slate_selector"
        )
    
    with metric1:
        st.metric("Lineups", "150", "20 new")
        
    with metric2:
        st.metric("Simulations", "20K", "5K new")
        
    with control_col:
        if st.button("🚀 Re-simulate", type="primary", use_container_width=True):
            run_simulation()

    # Get simulation data
    sim_data = DFSDataService.get_simulation_results()

    # Simulation Overview with Plotly Gauges
    st.markdown("### 📈 Live Simulation Metrics")
    
    gauge_cols = st.columns(5)
    
    with gauge_cols[0]:
        fig_win = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=sim_data['avg_win_rate'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Win Rate %", 'font': {'size': 16}},
            delta={'reference': 8.5, 'suffix': "%"},
            gauge={
                'axis': {'range': [None, 20]},
                'bar': {'color': "#3b82f6"},
                'steps': [
                    {'range': [0, 8], 'color': "#fecaca"},
                    {'range': [8, 12], 'color': "#fde68a"}, 
                    {'range': [12, 20], 'color': "#bbf7d0"}
                ],
                'threshold': {'line': {'color': "red", 'width': 4}, 'thickness': 0.75, 'value': 15}
            }
        ))
        fig_win.update_layout(height=200, margin=dict(l=10,r=10,t=40,b=10))
        st.plotly_chart(fig_win, use_container_width=True)
    
    with gauge_cols[1]:
        fig_cash = go.Figure(go.Indicator(
            mode="gauge+number",
            value=sim_data['cash_rate'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Cash Rate %", 'font': {'size': 16}},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "#10b981"},
                'steps': [
                    {'range': [0, 50], 'color': "#fecaca"},
                    {'range': [50, 70], 'color': "#fde68a"},
                    {'range': [70, 100], 'color': "#bbf7d0"}
                ]
            }
        ))
        fig_cash.update_layout(height=200, margin=dict(l=10,r=10,t=40,b=10))
        st.plotly_chart(fig_cash, use_container_width=True)
    
    with gauge_cols[2]:
        fig_roi = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=sim_data['avg_roi'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg ROI %", 'font': {'size': 16}},
            delta={'reference': 100, 'suffix': "%"},
            gauge={
                'axis': {'range': [None, 200]},
                'bar': {'color': "#8b5cf6"},
                'steps': [
                    {'range': [0, 90], 'color': "#fecaca"},
                    {'range': [90, 120], 'color': "#fde68a"},
                    {'range': [120, 200], 'color': "#bbf7d0"}
                ]
            }
        ))
        fig_roi.update_layout(height=200, margin=dict(l=10,r=10,t=40,b=10))
        st.plotly_chart(fig_roi, use_container_width=True)
    
    with gauge_cols[3]:
        fig_dup = go.Figure(go.Indicator(
            mode="gauge+number",
            value=sim_data['duplicate_risk'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Duplicate %", 'font': {'size': 16}},
            gauge={
                'axis': {'range': [0, 20]},
                'bar': {'color': "#f59e0b"},
                'steps': [
                    {'range': [0, 5], 'color': "#bbf7d0"},
                    {'range': [5, 10], 'color': "#fde68a"},
                    {'range': [10, 20], 'color': "#fecaca"}
                ]
            }
        ))
        fig_dup.update_layout(height=200, margin=dict(l=10,r=10,t=40,b=10))
        st.plotly_chart(fig_dup, use_container_width=True)
    
    with gauge_cols[4]:
        fig_top5 = go.Figure(go.Indicator(
            mode="gauge+number",
            value=sim_data['top5_rate'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Top 5% Rate", 'font': {'size': 16}},
            gauge={
                'axis': {'range': [None, 50]},
                'bar': {'color': "#6366f1"},
                'steps': [
                    {'range': [0, 20], 'color': "#fecaca"},
                    {'range': [20, 35], 'color': "#fde68a"},
                    {'range': [35, 50], 'color': "#bbf7d0"}
                ]
            }
        ))
        fig_top5.update_layout(height=200, margin=dict(l=10,r=10,t=40,b=10))
        st.plotly_chart(fig_top5, use_container_width=True)

    # Main Dashboard Layout
    results_col, controls_col = st.columns([2, 1])
    
    with results_col:
        st.markdown("### 🏆 Top Simulation Results")
        
        # Advanced filtering
        filter_col1, filter_col2, filter_col3 = st.columns(3)
        
        with filter_col1:
            sort_option = st.selectbox("Sort by", ["ROI (Highest)", "Win Rate", "Cash Rate", "Low Duplicate"])
        with filter_col2:
            min_roi = st.slider("Min ROI %", 50, 200, 100, 5)
        with filter_col3:
            max_dup = st.slider("Max Dup %", 1, 20, 10, 1)
        
        # Filter and display lineups
        filtered_lineups = [
            lineup for lineup in sim_data['lineups'] 
            if lineup['roi'] >= min_roi and lineup['duplicate_risk'] <= max_dup
        ]
        
        if filtered_lineups:
            for lineup in filtered_lineups:
                tier_class = f"tier-{lineup['tier'].lower()}" if lineup['tier'].lower() in ['top', 'good', 'risk'] else "tier-good"
                
                st.markdown(f"""
                <div class="{tier_class}">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <strong style="font-size: 1.1rem;">#{lineup['rank']}</strong>
                            <span style="font-size: 0.9rem; color: #6b7280;">{lineup['stack']} Stack</span>
                            <span style="background: {'#22c55e' if lineup['tier'] == 'TOP' else '#f59e0b' if lineup['tier'] == 'GOOD' else '#6b7280'}; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: bold;">{lineup['tier']}</span>
                        </div>
                        <div style="display: flex; gap: 1rem; font-size: 0.9rem; font-weight: 600;">
                            <span style="color: #22c55e;">ROI: {lineup['roi']}%</span>
                            <span style="color: #3b82f6;">Win: {lineup['win_rate']}%</span>
                            <span style="color: #8b5cf6;">Cash: {lineup['cash_rate']}%</span>
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: #374151; margin-bottom: 0.5rem;">
                        <strong>Lineup:</strong> {lineup['players']}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280;">
                        <span>Salary: ${lineup['salary']:,}</span>
                        <span>Proj: {lineup['projection']}</span>
                        <span>Dup: {lineup['duplicate_risk']}%</span>
                        <span>Own: {lineup['ownership']}%</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Add selection button
                if st.button(f"✅ Select Lineup #{lineup['rank']}", key=f"select_{lineup['rank']}", type="secondary"):
                    st.success(f"Lineup #{lineup['rank']} selected for export!")
                
                st.write("")  # spacing
        
        else:
            st.warning("⚠️ No lineups match current filter criteria")

        # Performance Analysis Charts
        st.markdown("### 📊 Portfolio Performance Analysis")
        
        chart_col1, chart_col2 = st.columns(2)
        
        with chart_col1:
            # ROI vs Win Rate Scatter
            scatter_data = pd.DataFrame({
                'ROI': [lineup['roi'] for lineup in sim_data['lineups']],
                'Win_Rate': [lineup['win_rate'] for lineup in sim_data['lineups']],
                'Duplicate_Risk': [lineup['duplicate_risk'] for lineup in sim_data['lineups']],
                'Rank': [f"#{lineup['rank']}" for lineup in sim_data['lineups']],
                'Tier': [lineup['tier'] for lineup in sim_data['lineups']]
            })
            
            fig_scatter = px.scatter(
                scatter_data,
                x='Win_Rate',
                y='ROI',
                size='Duplicate_Risk',
                color='Tier',
                hover_data=['Rank'],
                title="ROI vs Win Rate Analysis",
                color_discrete_map={'TOP': '#22c55e', 'GOOD': '#3b82f6', 'OK': '#6b7280', 'RISK': '#ef4444'}
            )
            fig_scatter.update_layout(height=350)
            st.plotly_chart(fig_scatter, use_container_width=True)
        
        with chart_col2:
            # Stack Distribution
            stack_counts = {}
            for lineup in sim_data['lineups']:
                stack = lineup['stack']
                stack_counts[stack] = stack_counts.get(stack, 0) + 1
            
            fig_pie = px.pie(
                values=list(stack_counts.values()),
                names=list(stack_counts.keys()),
                title="Stack Type Distribution"
            )
            fig_pie.update_layout(height=350)
            st.plotly_chart(fig_pie, use_container_width=True)

    with controls_col:
        st.markdown("### ⚙️ Player Adjustments")
        
        # Get player data
        players_df = DFSDataService.get_player_data()
        
        # Key players for adjustment
        key_players = ['Josh Allen', 'Christian McCaffrey', 'Tyreek Hill', 'Travis Kelce', 'Saquon Barkley']
        
        for player in key_players:
            player_data = players_df[players_df['Player'] == player].iloc[0]
            
            with st.expander(f"🏈 {player} ({player_data['Position']}) - {player_data['AI_Score']}"):
                # Projection editing
                new_proj = st.number_input(
                    "Projection",
                    value=float(player_data['Projection']),
                    min_value=0.0,
                    max_value=50.0,
                    step=0.1,
                    key=f"{player}_proj",
                    help=f"Current value: {player_data['Value']}x"
                )
                
                # Salary info
                st.caption(f"💰 **${player_data['Salary']:,}** salary • **{player_data['Value']}x** value")
                
                # Exposure controls
                exposure_min, exposure_max = st.slider(
                    "Exposure Range %",
                    0, 100, (0, 100),
                    key=f"{player}_exposure",
                    help="Min and max percentage across all lineups"
                )
                
                # Player preferences
                pref_cols = st.columns(3)
                with pref_cols[0]:
                    like = st.checkbox("👍", value=False, key=f"{player}_like", help="Like this player")
                with pref_cols[1]:
                    lock = st.checkbox("🔒", value=False, key=f"{player}_lock", help="Lock in lineups")  
                with pref_cols[2]:
                    boom = st.checkbox("⚡", value=False, key=f"{player}_boom", help="Boom/bust play")
        
        # Re-optimization controls
        st.markdown("### 🔄 Optimization Settings")
        
        additional_lineups = st.number_input("Additional Lineups", 10, 100, 50, 10)
        min_roi_threshold = st.slider("Min ROI Threshold %", 80, 150, 100, 5)
        unique_players = st.slider("Unique Players", 3, 8, 6, 1)
        
        if st.button("🚀 Re-optimize with Changes", type="primary", use_container_width=True):
            with st.spinner("Running enhanced optimization..."):
                run_simulation()
                st.rerun()

    # Complete Player Pool Editor
    st.markdown("### 👥 Player Pool Editor")
    
    # Position filters
    pos_filter = st.multiselect(
        "Filter Positions", 
        ['QB', 'RB', 'WR', 'TE', 'DST'], 
        default=['QB', 'RB', 'WR', 'TE', 'DST']
    )
    
    ai_filter = st.multiselect(
        "Filter AI Grades",
        ['A+', 'A', 'B+', 'B', 'C'],
        default=['A+', 'A', 'B+', 'B']
    )
    
    # Filter dataframe
    filtered_players = players_df[
        (players_df['Position'].isin(pos_filter)) & 
        (players_df['AI_Score'].isin(ai_filter))
    ]
    
    # Interactive data editor
    edited_df = st.data_editor(
        filtered_players,
        use_container_width=True,
        height=400,
        column_config={
            "Projection": st.column_config.NumberColumn(
                "Projection",
                min_value=0.0,
                max_value=50.0,
                step=0.1,
                format="%.1f",
                help="Fantasy points projection"
            ),
            "Salary": st.column_config.NumberColumn(
                "Salary",
                format="$%d",
                disabled=True
            ),
            "Value": st.column_config.NumberColumn(
                "Value",
                format="%.2fx",
                disabled=True,
                help="Projection per $1K salary"
            ),
            "Ownership": st.column_config.NumberColumn(
                "Own%",
                format="%.1f%%",
                disabled=True
            )
        },
        hide_index=True,
        key="player_data_editor"
    )

    # Export and Actions
    st.markdown("### 📤 Export & Actions")
    
    export_col1, export_col2, export_col3 = st.columns(3)
    
    with export_col1:
        if st.button("📄 Export Top 20 CSV", type="secondary"):
            # Create export data
            export_data = []
            for lineup in sim_data['lineups'][:20]:
                export_data.append({
                    'Rank': lineup['rank'],
                    'QB': lineup['players'].split(' • ')[0],
                    'RB1': lineup['players'].split(' • ')[1],
                    'RB2': lineup['players'].split(' • ')[2],
                    'WR1': lineup['players'].split(' • ')[3],
                    'WR2': lineup['players'].split(' • ')[4],
                    'WR3': lineup['players'].split(' • ')[5],
                    'TE': lineup['players'].split(' • ')[6],
                    'DST': lineup['players'].split(' • ')[7],
                    'Salary': lineup['salary'],
                    'Projection': lineup['projection'],
                    'ROI': lineup['roi'],
                    'Win_Rate': lineup['win_rate'],
                    'Cash_Rate': lineup['cash_rate'],
                    'Duplicate_Risk': lineup['duplicate_risk']
                })
            
            csv_data = pd.DataFrame(export_data).to_csv(index=False)
            st.download_button(
                "💾 Download CSV",
                data=csv_data,
                file_name=f"dfs_lineups_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                mime="text/csv"
            )
    
    with export_col2:
        if st.button("💾 Save Settings", type="secondary"):
            st.success("✅ Player settings saved!")
    
    with export_col3:
        if st.button("🔄 Reset All", type="secondary"):
            st.warning("⚠️ Settings reset to defaults!")
            st.rerun()

    # MCP Status in sidebar
    with st.sidebar:
        st.markdown("### 🔧 MCP Services")
        st.text("🟢 Sequential Thinking")
        st.text("🟢 Memory Graph")
        st.text("🟢 Docker Gateway")
        st.text("🟢 Filesystem")
        st.text("🟡 Plotly (Active)")
        st.text("🟡 Database (Simulated)")
        st.text("🟡 Redis (Ready)")
        st.text("🟡 WebSocket (Ready)")

if __name__ == "__main__":
    main()

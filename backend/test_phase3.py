import asyncio
import os
import sys

# Add backend directory to path
sys.path.append('d:/Main Projects/IPWithTools/backend')

from app.services.phase_service import start_phase_graph

if __name__ == "__main__":
    try:
        project_id = "8ac98ba0-0e82-44c4-8a33-db544fb11f63"
        print("Running risk analysis...")
        res = start_phase_graph(project_id, "risk_analysis", "test problem")
        print("Success:", res)
    except Exception as e:
        import traceback
        with open("error.txt", "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)

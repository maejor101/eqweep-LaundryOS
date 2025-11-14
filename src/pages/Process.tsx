const Process = () => {
  return (
    <div className="flex h-[calc(100vh-80px)] bg-background p-6 gap-4 overflow-x-auto">
      {["To-Do", "Washers", "Waiting", "Dryers", "Completed"].map((column) => (
        <div key={column} className="flex-1 min-w-[280px]">
          <div className="bg-card rounded-2xl h-full p-4">
            <h2 className="text-2xl font-bold mb-4">{column}</h2>
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No orders yet</p>
              <p className="text-xs mt-2">Orders will appear here as they progress</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Process;

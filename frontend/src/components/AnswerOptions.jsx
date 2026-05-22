import { motion } from "framer-motion";

export default function AnswerOptions({ options, selected, onSelect }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.value)}
            className={`rounded-full border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${
              isSelected
                ? "scale-[1.02] border-accent bg-accent/10 text-accent shadow-glow"
                : "border-primary/30 bg-white hover:border-primary hover:shadow-md dark:bg-slate-900"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              {opt.label}
              {isSelected && (
                <span className="text-accent" aria-hidden>
                  ✓
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

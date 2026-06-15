export default function ExamQuestionCard({ question, value, onChange }) {
  const options = [
    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d]
  ];

  return (
    <div className="panel p-6">
      <h3 className="font-bold leading-7">{question.question}</h3>
      <div className="mt-5 grid gap-3">
        {options.map(([key, label]) => (
          <label key={key} className={`flex cursor-pointer items-center gap-3 border p-3 ${value === key ? "border-byte-maroon bg-red-50" : "border-byte-line bg-white"}`}>
            <input type="radio" name={`q-${question.id}`} value={key} checked={value === key} onChange={() => onChange(question.id, key)} />
            <span className="text-sm">{key}. {label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

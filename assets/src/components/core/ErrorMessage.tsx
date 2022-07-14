export default ({ error }: { error: string | null | undefined }) => (
  <>{error && <div className="my-4 text-center text-red-600 font-semibold">{error}</div>}</>
)

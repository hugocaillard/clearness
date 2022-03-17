interface Props {
  date: string | Date
  formatter: Intl.DateTimeFormat
}

export default function DateString(props: Props) {
  const date =
    typeof props.date === 'string' ? new Date(props.date) : props.date

  return <span>{props.formatter.format(date)}</span>
}

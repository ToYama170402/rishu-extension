import React from "react"

export type RenderCellProps<T> = {
  xFragment: any
  yFragment: any
  dataFragment: T | undefined
}
export type RenderColumnProps = {
  xFragment: any
  children: React.ReactNode
}
type props<T> = {
  data: T[]
  xArray: any[]
  yArray: any[]
  xKey: string
  yKey: string
  className?: string
  RenderCell: React.FC<RenderCellProps<T>>
  RenderColumn: React.FC<RenderColumnProps>
}
export default <T,>({
  data,
  xArray,
  yArray,
  xKey,
  yKey,
  className,
  RenderCell,
  RenderColumn
}: props<T>) => {
  return (
    <div className={className}>
      {xArray.map((xFragment) => (
        <RenderColumn xFragment={xFragment} key={xFragment}>
          <>
            {yArray.map((yFragment) => {
              const course = data.filter((dataFragment) => {
                const xValue = xKey
                  .split(".")
                  .reduce((acc, key) => acc[key], dataFragment)
                const yValue = yKey
                  .split(".")
                  .reduce((acc, key) => acc[key], dataFragment)
                return xValue === xFragment && yValue === yFragment
              })
              return (
                <RenderCell
                  xFragment={xFragment}
                  yFragment={yFragment}
                  dataFragment={course[0]}
                  key={yFragment}
                />
              )
            })}
          </>
        </RenderColumn>
      ))}
    </div>
  )
}
